// SPDX-License-Identifier: Apache-2.0
import { createPublicKey, verify as verifySignature } from "node:crypto";
import { open, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { decodeUtf8, parseJsonBytes, parseJsonStrict } from "./json.mjs";

const objectKeys = {
  root: ["payload", "signature", "status_url"],
  payload: ["schema_version", "envelope_id", "subject", "authority", "scope", "evidence_refs", "decision", "lifecycle", "issuer"],
  subject: ["kind", "id", "version"],
  authority: ["type", "id"],
  scope: ["environment", "change"],
  evidence: ["kind", "digest"],
  decision: ["status", "conditions"],
  lifecycle: ["issued_at", "expires_at", "revoked_at", "supersedes", "superseded_by"],
  issuer: ["id", "key_id"],
  signature: ["algorithm", "key_id", "value"]
};

function exactKeys(value, allowed, required = allowed) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.every((key) => allowed.includes(key)) && required.every((key) => keys.includes(key));
}

function text(value, max) {
  if (typeof value !== "string" || value.length === 0 || value.length > max) return false;
  for (let index = 0; index < value.length; index++) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

function timestamp(value) {
  if (typeof value !== "string") return false;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/);
  if (!match) return false;
  const instant = new Date(value);
  return Number.isFinite(instant.getTime()) &&
    instant.getUTCFullYear() === Number(match[1]) &&
    instant.getUTCMonth() + 1 === Number(match[2]) &&
    instant.getUTCDate() === Number(match[3]) &&
    instant.getUTCHours() === Number(match[4]) &&
    instant.getUTCMinutes() === Number(match[5]) &&
    instant.getUTCSeconds() === Number(match[6]);
}

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function parsePublicKey(value) {
  if (typeof value !== "string" ||
      /-----BEGIN [^-]*PRIVATE KEY-----/u.test(value)) {
    throw new Error("public_key_required");
  }
  let key;
  if (value.trimStart().startsWith("{")) {
    const parsed = parseJsonStrict(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
        parsed.kty !== "OKP" || parsed.crv !== "Ed25519" ||
        typeof parsed.x !== "string" || Object.hasOwn(parsed, "d")) {
      throw new Error("public_jwk_required");
    }
    key = createPublicKey({ key: parsed, format: "jwk" });
  } else {
    key = createPublicKey(value);
  }
  if (key.asymmetricKeyType !== "ed25519") throw new Error("ed25519_required");
  return key;
}

export function validateEnvelope(document) {
  const errors = [];
  const digest = /^sha256:[a-f0-9]{64}$/;
  const envelopeId = /^de_[a-z0-9_]{8,80}$/;
  if (!exactKeys(document, objectKeys.root, ["payload", "signature"])) return ["root_contract"];
  const { payload, signature } = document;
  if (!exactKeys(payload, objectKeys.payload)) errors.push("payload_contract");
  if (payload?.schema_version !== "1.0.0") errors.push("schema_version");
  if (!envelopeId.test(payload?.envelope_id ?? "")) errors.push("envelope_id");
  if (!exactKeys(payload?.subject, objectKeys.subject) ||
      !text(payload?.subject?.kind, 64) ||
      !text(payload?.subject?.id, 160) ||
      !digest.test(payload?.subject?.version ?? "")) errors.push("subject");
  if (!exactKeys(payload?.authority, objectKeys.authority) ||
      payload?.authority?.type !== "customer" ||
      !text(payload?.authority?.id, 160)) errors.push("authority");
  if (!exactKeys(payload?.scope, objectKeys.scope) ||
      !text(payload?.scope?.environment, 80) ||
      !text(payload?.scope?.change, 240)) errors.push("scope");
  if (!Array.isArray(payload?.evidence_refs) ||
      payload.evidence_refs.length < 1 ||
      payload.evidence_refs.length > 64 ||
      payload.evidence_refs.some((item) =>
        !exactKeys(item, objectKeys.evidence) ||
        !text(item.kind, 64) ||
        !digest.test(item.digest ?? "")) ||
      new Set(payload?.evidence_refs?.map((item) => `${item.kind}\0${item.digest}`)).size !==
        payload?.evidence_refs?.length) errors.push("evidence_refs");
  if (!exactKeys(payload?.decision, objectKeys.decision) ||
      !["pass", "blocked"].includes(payload?.decision?.status) ||
      !Array.isArray(payload?.decision?.conditions) ||
      payload.decision.conditions.length > 32 ||
      payload.decision.conditions.some((item) => !text(item, 320)) ||
      new Set(payload?.decision?.conditions).size !== payload?.decision?.conditions?.length) errors.push("decision");
  if (!exactKeys(payload?.lifecycle, objectKeys.lifecycle, ["issued_at", "expires_at"]) ||
      !timestamp(payload?.lifecycle?.issued_at) ||
      !timestamp(payload?.lifecycle?.expires_at) ||
      (payload?.lifecycle?.revoked_at !== undefined && !timestamp(payload.lifecycle.revoked_at)) ||
      (payload?.lifecycle?.supersedes !== undefined && !envelopeId.test(payload.lifecycle.supersedes)) ||
      (payload?.lifecycle?.superseded_by !== undefined && !envelopeId.test(payload.lifecycle.superseded_by))) errors.push("lifecycle");
  if (timestamp(payload?.lifecycle?.issued_at) &&
      timestamp(payload?.lifecycle?.expires_at) &&
      Date.parse(payload.lifecycle.expires_at) <= Date.parse(payload.lifecycle.issued_at)) errors.push("lifecycle_order");
  if (timestamp(payload?.lifecycle?.revoked_at) &&
      timestamp(payload?.lifecycle?.issued_at) &&
      Date.parse(payload.lifecycle.revoked_at) < Date.parse(payload.lifecycle.issued_at)) errors.push("lifecycle_order");
  if (payload?.lifecycle?.supersedes === payload?.envelope_id ||
      payload?.lifecycle?.superseded_by === payload?.envelope_id) errors.push("lifecycle_relation");
  if (!exactKeys(payload?.issuer, objectKeys.issuer) ||
      !text(payload?.issuer?.id, 160) ||
      !text(payload?.issuer?.key_id, 80)) errors.push("issuer");
  if (!exactKeys(signature, objectKeys.signature) ||
      signature?.algorithm !== "Ed25519" ||
      !text(signature?.key_id, 80) ||
      !/^[A-Za-z0-9+/]{86}==$/.test(signature?.value ?? "") ||
      signature?.key_id !== payload?.issuer?.key_id) errors.push("signature");
  if (document.status_url !== undefined &&
      document.status_url !== `/v1/decision-envelopes/${payload?.envelope_id}/status`) errors.push("status_url");
  return [...new Set(errors)];
}

function verifyStatus(document, key, envelope, at) {
  const payload = document?.payload;
  const signature = document?.signature;
  const envelopeId = /^de_[a-z0-9_]{8,80}$/;
  if (!exactKeys(document, ["payload", "signature"]) ||
      !exactKeys(payload,
        ["schema_version", "envelope_id", "state", "observed_at", "issued_at", "expires_at", "revoked_at", "superseded_by"],
        ["schema_version", "envelope_id", "state", "observed_at", "issued_at", "expires_at"]) ||
      payload.schema_version !== "1.0.0" ||
      payload.envelope_id !== envelope.payload.envelope_id ||
      !envelopeId.test(payload.envelope_id) ||
      !["active", "expired", "revoked", "superseded"].includes(payload.state) ||
      !timestamp(payload.observed_at) ||
      !timestamp(payload.issued_at) ||
      !timestamp(payload.expires_at) ||
      payload.issued_at !== envelope.payload.lifecycle.issued_at ||
      payload.expires_at !== envelope.payload.lifecycle.expires_at ||
      Date.parse(payload.expires_at) <= Date.parse(payload.issued_at) ||
      Date.parse(payload.observed_at) < Date.parse(payload.issued_at) ||
      Date.parse(payload.observed_at) > at ||
      (payload.revoked_at !== undefined && !timestamp(payload.revoked_at)) ||
      (payload.revoked_at !== undefined &&
        (Date.parse(payload.revoked_at) < Date.parse(payload.issued_at) ||
          Date.parse(payload.revoked_at) > Date.parse(payload.observed_at))) ||
      (payload.superseded_by !== undefined && !envelopeId.test(payload.superseded_by)) ||
      (payload.state === "revoked") !== (payload.revoked_at !== undefined) ||
      (payload.state === "superseded") !== (payload.superseded_by !== undefined) ||
      (payload.state === "active" && Date.parse(payload.observed_at) >= Date.parse(payload.expires_at)) ||
      (payload.state === "expired" && Date.parse(payload.observed_at) < Date.parse(payload.expires_at)) ||
      !exactKeys(signature, objectKeys.signature) ||
      signature.algorithm !== "Ed25519" ||
      signature.key_id !== envelope.payload.issuer.key_id ||
      !/^[A-Za-z0-9+/]{86}==$/.test(signature.value ?? "")) return null;
  return verifySignature(
    null,
    Buffer.from(canonical(payload)),
    key,
    Buffer.from(signature.value, "base64")
  ) ? payload : null;
}

export async function verifyEnvelope(document, publicKeyText, now = new Date(), statusDocument = null, expected = {}) {
  const errors = validateEnvelope(document);
  if (errors.length) return { status: "invalid", valid: false, errors };

  let signatureValid = false;
  try {
    const key = parsePublicKey(publicKeyText);
    signatureValid = verifySignature(
      null,
      Buffer.from(canonical(document.payload)),
      key,
      Buffer.from(document.signature.value, "base64")
    );
  } catch {
    return { status: "invalid", valid: false, errors: ["public_key"] };
  }
  if (!signatureValid) return { status: "tampered", valid: false, envelope_id: document.payload.envelope_id };
  if ((expected.subjectId && document.payload.subject.id !== expected.subjectId) ||
      (expected.subjectVersion && document.payload.subject.version !== expected.subjectVersion)) {
    return { status: "invalid", valid: false, errors: ["subject_mismatch"] };
  }
  if (expected.authorityId && document.payload.authority.id !== expected.authorityId) {
    return { status: "invalid", valid: false, errors: ["authority_mismatch"] };
  }
  if ((expected.scopeEnvironment &&
        document.payload.scope.environment !== expected.scopeEnvironment) ||
      (expected.scopeChange && document.payload.scope.change !== expected.scopeChange)) {
    return { status: "invalid", valid: false, errors: ["scope_mismatch"] };
  }

  const at = now.getTime();
  const lifecycle = document.payload.lifecycle;
  const statusMaxAgeSeconds = expected.statusMaxAgeSeconds;
  if (!Number.isFinite(at)) return { status: "invalid", valid: false, errors: ["verification_time"] };
  if (statusMaxAgeSeconds !== undefined &&
      (!Number.isSafeInteger(statusMaxAgeSeconds) || statusMaxAgeSeconds < 0 ||
        statusMaxAgeSeconds > Math.floor(Number.MAX_SAFE_INTEGER / 1000))) {
    return { status: "invalid", valid: false, errors: ["status_freshness_policy"] };
  }
  if (statusMaxAgeSeconds !== undefined && !statusDocument) {
    return { status: "invalid", valid: false, errors: ["status_required"] };
  }
  if (statusDocument) {
    let key;
    try { key = parsePublicKey(publicKeyText); } catch { return { status: "invalid", valid: false, errors: ["public_key"] }; }
    const status = verifyStatus(statusDocument, key, document, at);
    if (!status) return { status: "tampered", valid: false, envelope_id: document.payload.envelope_id };
    if (statusMaxAgeSeconds !== undefined &&
        at - Date.parse(status.observed_at) > statusMaxAgeSeconds * 1000) {
      return { status: "invalid", valid: false, errors: ["status_stale"] };
    }
    if (status.state !== "active") {
      return {
        status: status.state,
        valid: false,
        envelope_id: document.payload.envelope_id,
        ...(status.superseded_by ? { superseded_by: status.superseded_by } : {})
      };
    }
  }
  if (Date.parse(lifecycle.issued_at) > at) return { status: "invalid", valid: false, errors: ["not_yet_issued"] };
  if (lifecycle.revoked_at && Date.parse(lifecycle.revoked_at) <= at) {
    return { status: "revoked", valid: false, envelope_id: document.payload.envelope_id };
  }
  if (lifecycle.superseded_by) {
    return { status: "superseded", valid: false, envelope_id: document.payload.envelope_id, superseded_by: lifecycle.superseded_by };
  }
  if (Date.parse(lifecycle.expires_at) <= at) {
    return { status: "expired", valid: false, envelope_id: document.payload.envelope_id };
  }
  if (document.payload.decision.status === "blocked") {
    return { status: "blocked", valid: false, envelope_id: document.payload.envelope_id };
  }
  return { status: "pass", valid: true, envelope_id: document.payload.envelope_id };
}

function parseArgs(args) {
  const options = { envelope: args[0] };
  for (let index = 1; index < args.length; index += 2) {
    if (args[index] === "--key") options.key = args[index + 1];
    else if (args[index] === "--at") options.at = args[index + 1];
    else if (args[index] === "--status") options.status = args[index + 1];
    else if (args[index] === "--subject-id") options.subjectId = args[index + 1];
    else if (args[index] === "--subject-version") options.subjectVersion = args[index + 1];
    else if (args[index] === "--authority-id") options.authorityId = args[index + 1];
    else if (args[index] === "--scope-environment") options.scopeEnvironment = args[index + 1];
    else if (args[index] === "--scope-change") options.scopeChange = args[index + 1];
    else if (args[index] === "--status-max-age-seconds") {
      if (!/^(?:0|[1-9]\d{0,14})$/u.test(args[index + 1] ?? "")) throw new Error("status_freshness_policy");
      options.statusMaxAgeSeconds = Number(args[index + 1]);
    }
    else throw new Error("unknown_argument");
  }
  if (!options.envelope || !options.key) throw new Error("usage");
  if (Boolean(options.subjectId) !== Boolean(options.subjectVersion)) throw new Error("subject_binding_required");
  if (Boolean(options.scopeEnvironment) !== Boolean(options.scopeChange)) throw new Error("scope_binding_required");
  return options;
}

async function readBounded(path, maximum) {
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size < 1 || metadata.size > maximum) throw new Error("invalid_file");
  const file = await open(path, "r");
  try {
    return await file.readFile();
  } finally {
    await file.close();
  }
}

export async function runCli(args) {
  try {
    const options = parseArgs(args);
    const [documentBytes, publicKeyBytes, statusBytes] = await Promise.all([
      readBounded(options.envelope, 131072),
      readBounded(options.key, 16384),
      options.status ? readBounded(options.status, 131072) : null
    ]);
    const result = await verifyEnvelope(
      parseJsonBytes(documentBytes),
      decodeUtf8(publicKeyBytes),
      options.at ? new Date(options.at) : new Date(),
      statusBytes ? parseJsonBytes(statusBytes) : null,
      {
        subjectId: options.subjectId,
        subjectVersion: options.subjectVersion,
        authorityId: options.authorityId,
        scopeEnvironment: options.scopeEnvironment,
        scopeChange: options.scopeChange,
        statusMaxAgeSeconds: options.statusMaxAgeSeconds
      }
    );
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return {
      pass: 0, blocked: 2, expired: 3, revoked: 4, superseded: 5, tampered: 6, invalid: 64
    }[result.status] ?? 64;
  } catch {
    process.stdout.write('{"status":"invalid","valid":false,"errors":["input"]}\n');
    return 64;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await runCli(process.argv.slice(2));
}
