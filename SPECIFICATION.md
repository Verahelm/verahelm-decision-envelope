# Decision Envelope specification 1.0

Status: public contract. Normative schema: [`schemas/decision-envelope.schema.json`](schemas/decision-envelope.schema.json).

## Purpose

A Decision Envelope carries a signed, bounded authorization record. It references evidence by digest; it does not contain raw evidence.

## Required bindings

- `envelope_id`: object identifier.
- `subject`: exact kind, identifier, and immutable version digest.
- `authority`: customer authority identifier and type.
- `scope`: bounded environment and change.
- `evidence_refs`: typed SHA-256 references.
- `decision`: `pass` or `blocked`, plus explicit conditions.
- `lifecycle`: issuance and expiry, with optional revocation or supersession.
- `issuer`: public issuer and key identifier.
- `signature`: Ed25519 signature over canonical `payload`.

Objects reject undeclared properties and duplicate JSON keys. Input must be
valid UTF-8. Timestamps are UTC RFC 3339 values ending in `Z`, with zero to
three fractional-second digits. Digests use `sha256:` plus 64 lowercase
hexadecimal characters. String fields reject unpaired Unicode surrogates.
Repeated evidence references and repeated conditions are rejected.

For the verification-only GitHub Action, `subject.version` is the SHA-256 digest
of the UTF-8 string `<owner/repository>@<head-revision>`. The template derives
this value from trusted workflow context. The Action fails when the expected
subject, authority, environment, or change differs from the signed envelope.

## Canonical form

The signature input is UTF-8 JSON with:

1. object keys sorted lexicographically; every schema-defined key is ASCII, for
   which JavaScript code-unit and Unicode code-point order are identical;
2. arrays retained in source order;
3. no insignificant whitespace;
4. JSON scalar encoding.

The included verifier is the executable reference for this contract.

The schemas define field shape. The verifier additionally checks cross-field
relations including lifecycle order, identifier binding, key identifiers,
self-supersession, and duplicate references.

The verification key is a trust anchor. Pull-request content may supply a key
file only when its exact SHA-256 fingerprint is independently configured and
checked outside pull-request content.

An offline trust bundle may replace the single-key file. The bundle is
independently pinned by its complete-file SHA-256 digest and binds each Ed25519
public key to one issuer, key identifier, and validity interval. Unknown,
duplicate, not-yet-valid, expired, malformed, or fingerprint-mismatched keys
fail closed. Updating a trusted bundle digest remains a customer-controlled
configuration change; the verifier does not retrieve trust material.

An optional signed status document can be checked against a caller-supplied
maximum age. Configuring a maximum age requires a status document; an older
status fails with `status_stale`. Without that policy, status authenticity is
verified but freshness is not established.

## Fail-closed result order

1. malformed input or unknown fields → `invalid`;
2. unsupported algorithm or key mismatch → `invalid`;
3. signature mismatch → `tampered`;
4. future issuance → `invalid`;
5. revocation → `revoked`;
6. supersession → `superseded`;
7. expiry → `expired`;
8. declared block → `blocked`;
9. otherwise → `pass`.

Only `pass` exits successfully. The Action matches the expected subject,
authority, environment, and change. Every consumer remains responsible for
enforcing each listed condition.
