import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign as createSignature } from "node:crypto";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { actionOutputs, verifyAction, writeActionOutputs } from "../action/index.mjs";
import { canonical, validateEnvelope, verifyEnvelope } from "../verifier/verify.mjs";
import { resolveTrustKey, validateTrustBundle } from "../verifier/trust.mjs";
import { parseJsonBytes, parseJsonStrict } from "../verifier/json.mjs";

const root = new URL("../", import.meta.url);
const publicKey = await readFile(new URL("fixtures/fixture-public-key.pem", root), "utf8");
const publicJwk = await readFile(new URL("fixtures/fixture-public-key.json", root), "utf8");
const trustBundleText = await readFile(new URL("fixtures/trust-bundle.json", root), "utf8");
const trustBundle = JSON.parse(trustBundleText);
const at = new Date("2026-07-27T12:00:00Z");

async function fixture(name) {
  return JSON.parse(await readFile(new URL(`fixtures/${name}.json`, root), "utf8"));
}

for (const [name, expected] of Object.entries({
  pass: "pass",
  blocked: "blocked",
  expired: "expired",
  tampered: "tampered"
})) {
  const result = await verifyEnvelope(await fixture(name), publicKey, at);
  assert.equal(result.status, expected, name);
  assert.equal(result.valid, expected === "pass", name);
}

const unknown = await fixture("pass");
unknown.payload.private_hint = "must be rejected";
assert.equal((await verifyEnvelope(unknown, publicKey, at)).status, "invalid");

const invalidDate = await fixture("pass");
invalidDate.payload.lifecycle.issued_at = "2026-02-30T00:00:00Z";
assert(validateEnvelope(invalidDate).includes("lifecycle"));

const duplicateEvidence = await fixture("pass");
duplicateEvidence.payload.evidence_refs.push(duplicateEvidence.payload.evidence_refs[0]);
assert(validateEnvelope(duplicateEvidence).includes("evidence_refs"));

const duplicateCondition = await fixture("pass");
duplicateCondition.payload.decision.conditions.push(duplicateCondition.payload.decision.conditions[0]);
assert(validateEnvelope(duplicateCondition).includes("decision"));

const invalidUnicode = await fixture("pass");
invalidUnicode.payload.decision.conditions[0] = "\ud800";
assert(validateEnvelope(invalidUnicode).includes("decision"));

const future = await fixture("pass");
future.payload.lifecycle.issued_at = "2098-01-01T00:00:00Z";
assert.equal((await verifyEnvelope(future, publicKey, at)).status, "tampered");

assert.equal((await verifyEnvelope(await fixture("pass"), "not a key", at)).status, "invalid");
assert.equal((await verifyEnvelope(await fixture("pass"), publicJwk, at)).status, "pass");
assert.deepEqual(validateTrustBundle(trustBundle), []);
const resolvedTrust = resolveTrustKey(trustBundle, await fixture("pass"), at);
assert.equal(resolvedTrust.fingerprint, `sha256:${createHash("sha256").update(publicKey).digest("hex")}`);
assert.equal((await verifyEnvelope(await fixture("pass"), resolvedTrust.publicKey, at)).status, "pass");
const alteredTrust = structuredClone(trustBundle);
alteredTrust.keys[0].fingerprint = `sha256:${"0".repeat(64)}`;
assert(validateTrustBundle(alteredTrust).includes("trust_bundle_fingerprint"));
const duplicateTrust = structuredClone(trustBundle);
duplicateTrust.keys.push(structuredClone(duplicateTrust.keys[0]));
assert(validateTrustBundle(duplicateTrust).includes("trust_bundle_duplicate_key"));
const invalidTrustDate = structuredClone(trustBundle);
invalidTrustDate.valid_from = "2026-02-30T00:00:00Z";
assert(validateTrustBundle(invalidTrustDate).includes("trust_bundle_lifecycle"));
const invalidTrustUnicode = structuredClone(trustBundle);
invalidTrustUnicode.keys[0].issuer_id = "\ud800";
assert(validateTrustBundle(invalidTrustUnicode).includes("trust_bundle_key"));
const expiredTrustKey = structuredClone(trustBundle);
expiredTrustKey.keys[0].expires_at = "2026-01-01T00:00:00Z";
assert.deepEqual(
  resolveTrustKey(expiredTrustKey, await fixture("pass"), at).errors,
  ["trust_key_expired"]
);
const unknownTrust = structuredClone(await fixture("pass"));
unknownTrust.payload.issuer.key_id = "unlisted-key";
assert.deepEqual(resolveTrustKey(trustBundle, unknownTrust, at).errors, ["trust_key_unavailable"]);
assert.deepEqual(
  resolveTrustKey(trustBundle, await fixture("pass"), new Date("2100-01-01T00:00:00Z")).errors,
  ["trust_bundle_expired"]
);
assert.equal((await verifyEnvelope(
  await fixture("pass"), publicKey, at, null,
  { subjectId: "synthetic-pr-agent", subjectVersion: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }
)).status, "pass");
assert.equal((await verifyEnvelope(
  await fixture("pass"), publicKey, at, null,
  { subjectId: "different-subject", subjectVersion: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" }
)).status, "invalid");
assert.equal((await verifyEnvelope(
  await fixture("pass"), publicKey, at, await fixture("revoked-status")
)).status, "revoked");
assert.equal((await verifyEnvelope(
  await fixture("pass"), publicKey, at, await fixture("superseded-status")
)).status, "superseded");
const tamperedStatus = await fixture("revoked-status");
tamperedStatus.payload.state = "active";
assert.equal((await verifyEnvelope(await fixture("pass"), publicKey, at, tamperedStatus)).status, "tampered");

const invalidRevocation = await fixture("pass");
invalidRevocation.payload.lifecycle.revoked_at = "2025-01-01T00:00:00Z";
assert(validateEnvelope(invalidRevocation).includes("lifecycle_order"));

const selfSupersession = await fixture("pass");
selfSupersession.payload.lifecycle.superseded_by = selfSupersession.payload.envelope_id;
assert(validateEnvelope(selfSupersession).includes("lifecycle_relation"));

const statusUrlMismatch = await fixture("pass");
statusUrlMismatch.status_url = "/v1/decision-envelopes/de_synthetic_99/status";
assert(validateEnvelope(statusUrlMismatch).includes("status_url"));

const workspace = new URL("../", import.meta.url).pathname;
const keyDigest = `sha256:${createHash("sha256").update(publicKey).digest("hex")}`;
const actionEnvironment = {
  GITHUB_WORKSPACE: workspace,
  INPUT_ENVELOPE: "fixtures/pass.json",
  "INPUT_PUBLIC-KEY": "fixtures/fixture-public-key.pem",
  "INPUT_PUBLIC-KEY-SHA256": keyDigest,
  "INPUT_SUBJECT-ID": "synthetic-pr-agent",
  "INPUT_SUBJECT-VERSION": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "INPUT_AUTHORITY-ID": "synthetic-customer",
  "INPUT_SCOPE-ENVIRONMENT": "synthetic-staging",
  "INPUT_SCOPE-CHANGE": "fictional-pull-request-42"
};
const runAction = (environment) => verifyAction(environment, at);
assert.equal((await runAction(actionEnvironment)).status, "pass");
const trustBundleEnvironment = { ...actionEnvironment };
delete trustBundleEnvironment["INPUT_PUBLIC-KEY"];
delete trustBundleEnvironment["INPUT_PUBLIC-KEY-SHA256"];
trustBundleEnvironment["INPUT_TRUST-BUNDLE"] = "fixtures/trust-bundle.json";
trustBundleEnvironment["INPUT_TRUST-BUNDLE-SHA256"] =
  `sha256:${createHash("sha256").update(trustBundleText).digest("hex")}`;
assert.equal((await runAction(trustBundleEnvironment)).status, "pass");
await assert.rejects(
  runAction({
    ...trustBundleEnvironment,
    "INPUT_PUBLIC-KEY": "fixtures/fixture-public-key.pem",
    "INPUT_PUBLIC-KEY-SHA256": keyDigest
  }),
  /trust_anchor_required/
);
await assert.rejects(
  runAction({
    ...trustBundleEnvironment,
    "INPUT_TRUST-BUNDLE-SHA256": `sha256:${"0".repeat(64)}`
  }),
  /trust_bundle_fingerprint_mismatch/
);
for (const [status, valid] of [
  ["pass", "true"],
  ["blocked", "false"],
  ["expired", "false"],
  ["revoked", "false"],
  ["superseded", "false"],
  ["tampered", "false"],
  ["invalid", "false"]
]) assert.deepEqual(actionOutputs({ status }), { status, valid });
assert.deepEqual(actionOutputs({ status: "unsupported" }), { status: "invalid", valid: "false" });
assert.deepEqual(actionOutputs(null), { status: "invalid", valid: "false" });
const actionOutputDirectory = await mkdtemp(join(tmpdir(), "verahelm-action-output-"));
const actionOutputPath = join(actionOutputDirectory, "github-output");
await writeActionOutputs(actionOutputPath, actionOutputs({ status: "pass" }));
assert.equal(await readFile(actionOutputPath, "utf8"), "status=pass\nvalid=true\n");
assert.deepEqual(
  (await runAction({ ...actionEnvironment, "INPUT_AUTHORITY-ID": "different-customer" })).errors,
  ["authority_mismatch"]
);
assert.deepEqual(
  (await runAction({ ...actionEnvironment, "INPUT_SCOPE-ENVIRONMENT": "synthetic-production" })).errors,
  ["scope_mismatch"]
);
assert.deepEqual(
  (await runAction({ ...actionEnvironment, "INPUT_SCOPE-CHANGE": "fictional-pull-request-99" })).errors,
  ["scope_mismatch"]
);
await assert.rejects(
  runAction({ ...actionEnvironment, "INPUT_AUTHORITY-ID": "" }),
  /authorization_binding_required/
);
await assert.rejects(
  runAction({ ...actionEnvironment, "INPUT_PUBLIC-KEY-SHA256": `sha256:${"0".repeat(64)}` }),
  /public_key_fingerprint_mismatch/
);
await assert.rejects(
  runAction({ ...actionEnvironment, "INPUT_PUBLIC-KEY-SHA256": "" }),
  /public_key_fingerprint_required/
);
assert.deepEqual(
  (await runAction({
    ...actionEnvironment,
    "INPUT_STATUS-MAX-AGE-SECONDS": "3600"
  })).errors,
  ["status_required"]
);
assert.equal(
  (await runAction({
    ...actionEnvironment,
    INPUT_STATUS: "fixtures/revoked-status.json",
    "INPUT_STATUS-MAX-AGE-SECONDS": "3600"
  })).status,
  "revoked"
);
await assert.rejects(
  runAction({
    ...actionEnvironment,
    "INPUT_STATUS-MAX-AGE-SECONDS": "-1"
  }),
  /status_freshness_policy/
);

assert.throws(
  () => parseJsonStrict('{"payload":1,"\\u0070ayload":2}'),
  /json_duplicate_key/
);
assert.throws(() => parseJsonBytes(Buffer.from([0xc3, 0x28])));
for (const source of [
  "null", "true", "false", "0", "-1.25e+3", '""', '"\\u0061"', "[]",
  '[1,{"a":"b"}]', '{"a":1,"b":[true,null]}'
]) {
  assert.deepEqual(parseJsonStrict(source), JSON.parse(source));
}
assert.equal(
  canonical({ z: "é", a: ["x", { b: "2", a: "1" }] }),
  '{"a":["x",{"a":"1","b":"2"}],"z":"é"}'
);

const ephemeralKeys = generateKeyPairSync("ed25519");
const ephemeralPublicKey = ephemeralKeys.publicKey.export({ type: "spki", format: "pem" });
const ephemeralPrivateKey = ephemeralKeys.privateKey.export({ type: "pkcs8", format: "pem" });
const ephemeralPrivateJwk = JSON.stringify(ephemeralKeys.privateKey.export({ format: "jwk" }));
const ephemeralKeyId = "fixture-ephemeral";

function signEnvelope(document) {
  document.payload.issuer.key_id = ephemeralKeyId;
  document.signature.key_id = ephemeralKeyId;
  document.signature.value = createSignature(
    null,
    Buffer.from(canonical(document.payload)),
    ephemeralKeys.privateKey
  ).toString("base64");
  return document;
}

function signStatus(payload) {
  return {
    payload,
    signature: {
      algorithm: "Ed25519",
      key_id: ephemeralKeyId,
      value: createSignature(
        null,
        Buffer.from(canonical(payload)),
        ephemeralKeys.privateKey
      ).toString("base64")
    }
  };
}

const ephemeralEnvelope = signEnvelope(await fixture("pass"));
assert.equal((await verifyEnvelope(ephemeralEnvelope, ephemeralPublicKey, at)).status, "pass");
assert.equal((await verifyEnvelope(ephemeralEnvelope, ephemeralPrivateKey, at)).status, "invalid");
assert.equal((await verifyEnvelope(ephemeralEnvelope, ephemeralPrivateJwk, at)).status, "invalid");

const excessivePrecision = structuredClone(ephemeralEnvelope);
excessivePrecision.payload.lifecycle.expires_at = "2099-01-01T00:00:00.0001Z";
assert(validateEnvelope(excessivePrecision).includes("lifecycle"));

const exactExpiry = structuredClone(ephemeralEnvelope);
exactExpiry.payload.lifecycle.expires_at = "2026-07-27T12:00:00Z";
signEnvelope(exactExpiry);
assert.equal((await verifyEnvelope(exactExpiry, ephemeralPublicKey, at)).status, "expired");

const expiredEnvelope = structuredClone(ephemeralEnvelope);
expiredEnvelope.payload.lifecycle.expires_at = "2026-07-27T10:00:00Z";
signEnvelope(expiredEnvelope);
const expiredStatus = signStatus({
  schema_version: "1.0.0",
  envelope_id: expiredEnvelope.payload.envelope_id,
  state: "expired",
  observed_at: "2026-07-27T12:00:00Z",
  issued_at: expiredEnvelope.payload.lifecycle.issued_at,
  expires_at: expiredEnvelope.payload.lifecycle.expires_at
});
assert.equal((await verifyEnvelope(
  expiredEnvelope, ephemeralPublicKey, new Date("2026-07-27T13:00:00Z"), expiredStatus
)).status, "expired");

const activeStatus = signStatus({
  schema_version: "1.0.0",
  envelope_id: ephemeralEnvelope.payload.envelope_id,
  state: "active",
  observed_at: "2026-07-27T10:00:00Z",
  issued_at: ephemeralEnvelope.payload.lifecycle.issued_at,
  expires_at: ephemeralEnvelope.payload.lifecycle.expires_at
});
assert.deepEqual(
  (await verifyEnvelope(
    ephemeralEnvelope, ephemeralPublicKey, at, activeStatus, { statusMaxAgeSeconds: 3600 }
  )).errors,
  ["status_stale"]
);
assert.deepEqual(
  (await verifyEnvelope(
    ephemeralEnvelope, ephemeralPublicKey, at, null, { statusMaxAgeSeconds: 3600 }
  )).errors,
  ["status_required"]
);

const futureStatus = structuredClone(activeStatus);
futureStatus.payload.observed_at = "2026-07-27T13:00:00Z";
futureStatus.signature.value = createSignature(
  null,
  Buffer.from(canonical(futureStatus.payload)),
  ephemeralKeys.privateKey
).toString("base64");
assert.equal((await verifyEnvelope(ephemeralEnvelope, ephemeralPublicKey, at, futureStatus)).status, "tampered");

await assert.rejects(
  runAction({
    ...actionEnvironment,
    INPUT_ENVELOPE: new URL("fixtures/pass.json", root).pathname
  }),
  /repository_relative_path_required/
);

process.stdout.write("conformance=pass cases=42 trust_bundle_cases=13 json_corpus=10 canonical_vectors=1 network=none dependencies=none\n");
