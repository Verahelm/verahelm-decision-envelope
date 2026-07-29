// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { lstat, open, realpath } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { verifyEnvelope } from "../verifier/verify.mjs";
import { decodeUtf8, parseJsonStrict } from "../verifier/json.mjs";

async function repositoryFile(workspace, input, fallback, maximum) {
  const requested = input || fallback;
  if (!requested || isAbsolute(requested)) throw new Error("repository_relative_path_required");
  const resolved = resolve(workspace, requested);
  if ((await lstat(resolved)).isSymbolicLink()) throw new Error("symlink_rejected");
  const canonical = await realpath(resolved);
  const relation = relative(workspace, canonical);
  if (!relation || relation.startsWith("..") || isAbsolute(relation)) throw new Error("path_outside_workspace");
  const metadata = await lstat(canonical);
  if (!metadata.isFile() || metadata.size < 1 || metadata.size > maximum) throw new Error("invalid_file");
  const file = await open(canonical, "r");
  try {
    const bytes = await file.readFile();
    return {
      text: decodeUtf8(bytes),
      digest: `sha256:${createHash("sha256").update(bytes).digest("hex")}`
    };
  } finally {
    await file.close();
  }
}

export async function verifyAction(env = process.env, now = new Date()) {
  const workspace = await realpath(env.GITHUB_WORKSPACE || process.cwd());
  const input = (name) => env[`INPUT_${name.toUpperCase()}`] ??
    env[`INPUT_${name.replaceAll("-", "_").toUpperCase()}`] ?? "";
  const subjectId = input("subject-id");
  const subjectVersion = input("subject-version");
  const authorityId = input("authority-id");
  const scopeEnvironment = input("scope-environment");
  const scopeChange = input("scope-change");
  const expectedKeyDigest = input("public-key-sha256");
  const statusMaximumAge = input("status-max-age-seconds");
  if (!subjectId || subjectId.length > 160 || !/^sha256:[a-f0-9]{64}$/.test(subjectVersion)) {
    throw new Error("subject_binding_required");
  }
  if (!authorityId || authorityId.length > 160 ||
      !scopeEnvironment || scopeEnvironment.length > 80 ||
      !scopeChange || scopeChange.length > 240) {
    throw new Error("authorization_binding_required");
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(expectedKeyDigest)) {
    throw new Error("public_key_fingerprint_required");
  }
  if (statusMaximumAge && !/^(?:0|[1-9]\d{0,14})$/u.test(statusMaximumAge)) {
    throw new Error("status_freshness_policy");
  }
  const [documentFile, publicKeyFile, statusFile] = await Promise.all([
    repositoryFile(workspace, input("envelope"), "decision-envelope.json", 131072),
    repositoryFile(workspace, input("public-key"), "decision-envelope-public-key.pem", 16384),
    input("status") ? repositoryFile(workspace, input("status"), null, 131072) : null
  ]);
  if (publicKeyFile.digest !== expectedKeyDigest) {
    throw new Error("public_key_fingerprint_mismatch");
  }
  return verifyEnvelope(
    parseJsonStrict(documentFile.text),
    publicKeyFile.text,
    now,
    statusFile ? parseJsonStrict(statusFile.text) : null,
    {
      subjectId,
      subjectVersion,
      authorityId,
      scopeEnvironment,
      scopeChange,
      ...(statusMaximumAge ? { statusMaxAgeSeconds: Number(statusMaximumAge) } : {})
    }
  );
}

async function run() {
  const result = await verifyAction();
  process.stdout.write(`status=${result.status}\n`);
  if (!result.valid) {
    process.stderr.write(`Decision Envelope verification failed: ${result.status}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(() => {
    process.stderr.write("Decision Envelope verification failed: invalid input\n");
    process.exitCode = 1;
  });
}
