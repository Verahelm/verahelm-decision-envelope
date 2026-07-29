#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { open, readFile, realpath, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parsePublicKey, runCli as runVerifier, validateEnvelope, verifyEnvelope } from "../verifier/verify.mjs";
import { decodeUtf8, parseJsonBytes } from "../verifier/json.mjs";

const root = new URL("../", import.meta.url);
const commands = new Set(["demo", "validate", "verify", "explain", "fingerprint"]);

async function boundedFile(path, maximum) {
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size < 1 || metadata.size > maximum) {
    throw new Error("invalid_file");
  }
  const file = await open(path, "r");
  try {
    return await file.readFile();
  } finally {
    await file.close();
  }
}

async function jsonFile(path, maximum = 65536) {
  return parseJsonBytes(await boundedFile(path, maximum));
}

async function demo() {
  const key = await readFile(new URL("fixtures/fixture-public-key.pem", root), "utf8");
  const at = new Date("2026-07-27T12:00:00Z");
  const results = [];
  for (const name of ["pass", "blocked", "expired", "tampered"]) {
    const document = parseJsonBytes(await readFile(new URL(`fixtures/${name}.json`, root)));
    results.push({ fixture: name, status: (await verifyEnvelope(document, key, at)).status });
  }
  return { status: "demo_complete", results };
}

async function validate(args) {
  const document = await jsonFile(args[0]);
  const errors = validateEnvelope(document);
  return { status: errors.length ? "invalid" : "valid", valid: errors.length === 0, errors };
}

async function explain(args) {
  const value = await jsonFile(args[0], 131072);
  const errors = validateEnvelope(value);
  if (errors.length) return { status: "invalid", valid: false, errors };
  const envelope = value?.payload && value?.signature ? value : null;
  const decision = envelope?.payload?.decision;
  if (decision) {
    return {
      status: decision.status,
      subject: envelope.payload.subject,
      scope: envelope.payload.scope,
      conditions: decision.conditions,
      expires_at: envelope.payload.lifecycle?.expires_at || null,
      note: "Declared public fields only. Run verify before relying on signature or lifecycle state."
    };
  }
  return { status: "invalid", valid: false, errors: ["decision_envelope"] };
}

async function fingerprint(args) {
  if (args.length !== 1) throw new Error("usage");
  const bytes = await boundedFile(args[0], 16384);
  parsePublicKey(decodeUtf8(bytes));
  const digest = createHash("sha256").update(bytes).digest("hex");
  return { status: "fingerprint", algorithm: "sha256", digest: `sha256:${digest}` };
}

export async function run(args) {
  const command = args[0];
  if (!commands.has(command)) throw new Error("usage");
  if (command === "verify") return runVerifier(args.slice(1));
  const result = command === "demo" ? await demo()
    : command === "validate" ? await validate(args.slice(1))
      : command === "explain" ? await explain(args.slice(1))
        : await fingerprint(args.slice(1));
  process.stdout.write(`${JSON.stringify(result)}\n`);
  return result.valid === false ? 2 : 0;
}

let entryUrl = null;
if (process.argv[1]) {
  try {
    entryUrl = pathToFileURL(await realpath(process.argv[1])).href;
  } catch {
    entryUrl = pathToFileURL(process.argv[1]).href;
  }
}
if (entryUrl === import.meta.url) {
  run(process.argv.slice(2)).then((code) => { process.exitCode = code; }).catch(() => {
    process.stderr.write("verahelm: command failed; run with demo, validate, verify, explain, or fingerprint\n");
    process.exitCode = 64;
  });
}
