# DSSE and in-toto interoperability

Verahelm uses Ed25519 and canonical JSON for its lightweight native envelope.
DSSE and in-toto are established transport and attestation structures. This
document defines a conservative mapping; it does not claim drop-in
compatibility or replace native verification.

## Semantic mapping

| Verahelm field or property | DSSE or in-toto representation | Mapping |
|---|---|---|
| Complete native envelope | DSSE `payload` | Serialize the complete native envelope as payload bytes and declare a versioned media type. DSSE requires a new DSSE signature. |
| `subject.id` | in-toto `subject[].name` | Copy only when the name is safe to disclose. |
| Digest-form `subject.version` | in-toto `subject[].digest` | Split the algorithm and hexadecimal value. Non-digest versions do not map losslessly. |
| Envelope digest | Custom predicate field | Reference the SHA-256 digest of the complete native envelope. |
| Evidence digests | Predicate references | Map as opaque digest references; do not embed raw evidence. |
| Native signature | No direct equivalent | Do not copy it into a DSSE signature. Native canonical JSON and DSSE pre-authentication encoding sign different bytes. |
| Issuer and key identifier | DSSE signature identity or external trust policy | Identity constraints remain a verifier policy responsibility. |
| Authority and scope | Custom predicate fields | No general in-toto equivalent. Omission is lossy. |
| Conditions | Custom predicate fields | No general DSSE or in-toto enforcement semantics. Consumers remain responsible for enforcement. |
| Expiry, revocation, supersession | No direct equivalent | Retain and verify Verahelm lifecycle state separately. |

## Reference predicate

[`in-toto-envelope-reference.json`](../examples/interoperability/in-toto-envelope-reference.json)
is a fictional in-toto Statement v1. It binds a fictional subject digest to a
fictional Decision Envelope digest and declares that native lifecycle status
is still required. Its `verahelm.example` predicate identifier is illustrative,
not a registered or hosted specification.

## Signature and canonicalization

The native Verahelm signature covers its canonical `payload` as defined in the
[specification](../SPECIFICATION.md). DSSE signs a payload type and payload
using DSSE pre-authentication encoding. Converting between them therefore
requires verification of the source object followed by a new signature over
the destination object. Copying signature bytes is invalid.

An in-toto Statement is a data model, not an authorization decision. Its
subject digest can bind the same artifact revision, but authority, scope,
conditions, freshness, revocation, and supersession remain Verahelm-specific.

## Freshness and replay

Neither DSSE wrapping nor an in-toto Statement establishes current lifecycle
state. A consumer must apply envelope expiry and its configured signed-status
freshness policy. Offline verification proves authenticity relative to the
provided trust anchor and status material; it cannot prove that a newer
revocation or supersession does not exist.

## Compatibility limits

- Native-to-DSSE conversion is not implemented in this release.
- In-toto import is lossless only for exact subject and digest references.
- Sigstore identity, transparency, and certificate policy require native
  Sigstore verification before a digest is referenced.
- SLSA provenance authenticity and builder policy require a provenance-aware
  verifier; Verahelm does not assign or certify an SLSA level.
- Lifecycle fields have no automatic external equivalent and must fail closed
  when a consumer requires them but cannot evaluate them.

Normative sources:
[DSSE protocol](https://github.com/secure-systems-lab/dsse/blob/master/protocol.md),
[in-toto Statement v1](https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md),
[Sigstore bundles](https://docs.sigstore.dev/about/bundle/), and
[SLSA provenance 1.1](https://slsa.dev/spec/v1.1/provenance).
