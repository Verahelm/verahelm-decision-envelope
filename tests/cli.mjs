import assert from "node:assert/strict";
import { evidenceDigest } from "../adapters/evidence-digest.mjs";
import { run } from "../cli/verahelm.mjs";

const pass = new URL("../fixtures/pass.json", import.meta.url).pathname;
const key = new URL("../fixtures/fixture-public-key.pem", import.meta.url).pathname;

assert.equal(await run(["validate", pass]), 0);
assert.equal(await run(["explain", pass]), 0);
assert.equal(await run(["demo"]), 0);
assert.equal(await run(["verify", pass, "--key", key, "--at", "2026-07-27T12:00:00Z"]), 0);
assert.equal(await run(["fingerprint", key]), 0);
await assert.rejects(run(["fingerprint", pass]));

const attestation = await evidenceDigest("attestation", pass);
assert.match(attestation.digest, /^sha256:[a-f0-9]{64}$/);

process.stdout.write("cli=pass commands=5 adapters=1 network=none writes=none\n");
