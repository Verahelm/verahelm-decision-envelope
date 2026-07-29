import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { evidenceDigest } from "../adapters/evidence-digest.mjs";

const root = resolve(new URL("../", import.meta.url).pathname);
const vectors = [
  ["opa", "examples/integrations/opa-result.json", "3a9c41dcd5ac2b5d8af28aa35cdfa07599c4e077121e7d217a5220c2acb2c093"],
  ["promptfoo", "examples/integrations/promptfoo-result.json", "819263ee86eff5644796c5460e3315402490773e699af160a7384144fd281344"],
  ["sarif", "examples/integrations/report.sarif.json", "f0ac3e23093fe41fd0f62568e97a330040d93c29d06864ddaca6e90637eb85ad"],
  ["sigstore", "examples/integrations/sigstore-bundle-reference.json", "1c06a5a4e59d782c34e9b61ad67c456f1fa83700bce1c07a448a51c037020410"],
  ["slsa", "examples/integrations/slsa-provenance-reference.json", "e4a58cb61d443f9de040e6ab07b8c0125cf149559ab2e2f3144abffef07356dc"]
];

for (const [kind, path, digest] of vectors) {
  assert.deepEqual(
    await evidenceDigest(kind, resolve(root, path)),
    { kind, digest: `sha256:${digest}` }
  );
}

await assert.rejects(
  evidenceDigest("unknown", resolve(root, vectors[0][1])),
  /unsupported_kind/
);
await assert.rejects(
  evidenceDigest("artifact", resolve(root, "examples/integrations/missing.json"))
);

const mapping = JSON.parse(await readFile(
  resolve(root, "examples/interoperability/in-toto-envelope-reference.json"),
  "utf8"
));
assert.deepEqual(Object.keys(mapping).sort(), ["_type", "predicate", "predicateType", "subject"]);
assert.equal(mapping._type, "https://in-toto.io/Statement/v1");
assert.equal(mapping.subject.length, 1);
assert.match(mapping.subject[0].digest.sha256, /^[0-9a-f]{64}$/);
assert.match(mapping.predicate.decisionEnvelopeDigest.sha256, /^[0-9a-f]{64}$/);

process.stdout.write(`integrations=pass vectors=${vectors.length} raw_upload=none native_verification=external\n`);
