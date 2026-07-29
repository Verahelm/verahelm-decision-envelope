// SPDX-License-Identifier: Apache-2.0
import { createHash } from "node:crypto";
import { parsePublicKey } from "./verify.mjs";

const digestPattern = /^sha256:[a-f0-9]{64}$/u;
const bundleIdPattern = /^tb_[a-z0-9_]{8,80}$/u;

function exactKeys(value, allowed) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).every((key) => allowed.includes(key)) &&
    allowed.every((key) => Object.hasOwn(value, key));
}

function boundedText(value, maximum) {
  if (typeof value !== "string" || value.length === 0 || value.length > maximum) return false;
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
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/u);
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

export function validateTrustBundle(bundle) {
  const errors = [];
  if (!exactKeys(bundle, [
    "schema_version", "bundle_id", "version", "valid_from", "expires_at", "keys"
  ])) return ["trust_bundle_contract"];
  if (bundle.schema_version !== "1.0.0") errors.push("trust_bundle_version");
  if (!bundleIdPattern.test(bundle.bundle_id ?? "") ||
      !Number.isSafeInteger(bundle.version) || bundle.version < 1) errors.push("trust_bundle_identity");
  if (!timestamp(bundle.valid_from) || !timestamp(bundle.expires_at) ||
      Date.parse(bundle.expires_at) <= Date.parse(bundle.valid_from)) errors.push("trust_bundle_lifecycle");
  if (!Array.isArray(bundle.keys) || bundle.keys.length < 1 || bundle.keys.length > 32) {
    errors.push("trust_bundle_keys");
    return [...new Set(errors)];
  }

  const identities = new Set();
  for (const entry of bundle.keys) {
    if (!exactKeys(entry, [
      "issuer_id", "key_id", "public_key", "fingerprint", "valid_from", "expires_at"
    ]) ||
        !boundedText(entry.issuer_id, 160) ||
        !boundedText(entry.key_id, 80) ||
        !boundedText(entry.public_key, 16384) ||
        !digestPattern.test(entry.fingerprint ?? "") ||
        !timestamp(entry.valid_from) ||
        !timestamp(entry.expires_at) ||
        Date.parse(entry.expires_at) <= Date.parse(entry.valid_from) ||
        Date.parse(entry.valid_from) < Date.parse(bundle.valid_from) ||
        Date.parse(entry.expires_at) > Date.parse(bundle.expires_at)) {
      errors.push("trust_bundle_key");
      continue;
    }
    const identity = `${entry.issuer_id}\0${entry.key_id}`;
    if (identities.has(identity)) errors.push("trust_bundle_duplicate_key");
    identities.add(identity);
    const actual = `sha256:${createHash("sha256").update(entry.public_key, "utf8").digest("hex")}`;
    if (actual !== entry.fingerprint) errors.push("trust_bundle_fingerprint");
    try {
      parsePublicKey(entry.public_key);
    } catch {
      errors.push("trust_bundle_public_key");
    }
  }
  return [...new Set(errors)];
}

export function resolveTrustKey(bundle, envelope, now = new Date()) {
  const errors = validateTrustBundle(bundle);
  if (errors.length) return { errors };
  const at = now.getTime();
  if (!Number.isFinite(at)) return { errors: ["verification_time"] };
  if (at < Date.parse(bundle.valid_from)) return { errors: ["trust_bundle_not_yet_valid"] };
  if (at >= Date.parse(bundle.expires_at)) return { errors: ["trust_bundle_expired"] };
  const entry = bundle.keys.find((candidate) =>
    candidate.issuer_id === envelope?.payload?.issuer?.id &&
    candidate.key_id === envelope?.payload?.issuer?.key_id);
  if (!entry) return { errors: ["trust_key_unavailable"] };
  if (at < Date.parse(entry.valid_from)) return { errors: ["trust_key_not_yet_valid"] };
  if (at >= Date.parse(entry.expires_at)) return { errors: ["trust_key_expired"] };
  return { publicKey: entry.public_key, fingerprint: entry.fingerprint };
}
