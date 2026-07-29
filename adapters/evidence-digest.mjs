// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { open, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const kinds = new Set([
  "artifact",
  "attestation",
  "cyclonedx",
  "eval_report",
  "in_toto",
  "junit",
  "opa",
  "promptfoo",
  "sarif",
  "sigstore",
  "slsa",
  "spdx"
]);

export async function evidenceDigest(kind, path) {
  if (!kinds.has(kind)) throw new Error("unsupported_kind");
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size < 1 || metadata.size > 16 * 1024 * 1024) {
    throw new Error("invalid_file");
  }
  const file = await open(path, "r");
  const hash = createHash("sha256");
  try {
    for await (const chunk of file.createReadStream()) hash.update(chunk);
  } finally {
    await file.close();
  }
  return { kind, digest: `sha256:${hash.digest("hex")}` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  evidenceDigest(process.argv[2], process.argv[3]).then((value) => {
    process.stdout.write(`${JSON.stringify(value)}\n`);
  }).catch(() => {
    process.stderr.write(
      `usage: node adapters/evidence-digest.mjs ${[...kinds].join("|")} FILE\n`
    );
    process.exitCode = 64;
  });
}
