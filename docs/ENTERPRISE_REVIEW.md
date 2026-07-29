# Technical review facts

This sheet covers the public verifier and integration kit. Hosted-service
terms, operational controls, and contractual commitments must be confirmed
separately.

| Question | Public component answer | Evidence |
|---|---|---|
| What does it do? | Verifies schema, Ed25519 signature, exact bindings, lifecycle, and configured signed-status freshness. | [Specification](../SPECIFICATION.md) |
| Does verification need network access? | No. Release tests reject network and subprocess capability in executable JavaScript. | [Release manifest](../PUBLIC_RELEASE_MANIFEST.md) |
| Does it execute pull-request code? | No. The supplied base-controlled workflow reads declared files and trusted workflow context only. | [Action contract](ACTION.md) |
| Runtime dependencies | None for the Node.js verifier package. | `package.json`; package contract test |
| GitHub permissions | `contents: read` for verification. | [Workflow template](../template/verahelm-change-gate.yml) |
| Trust anchor | Caller-controlled public key pinned by an independently configured SHA-256 fingerprint. | [Threat model](../THREAT_MODEL.md) |
| Key rotation | Optional offline multi-key bundle pinned by its complete-file SHA-256 digest, with issuer, key-ID, and validity-window constraints. | [Specification](../SPECIFICATION.md) |
| Raw evidence handling | The envelope references digests. Public adapters hash bounded local files without parsing or uploading them. | [Privacy boundary](../PRIVACY_BOUNDARY.md) |
| Unknown or unsupported input | Rejected fail closed. | Conformance suite and verifier exit codes |
| Lifecycle | Expiry, signed revocation, supersession, and optional maximum status age. | [Specification](../SPECIFICATION.md) |
| Release identity | Immutable GitHub release, source commit receipt, SHA-256 inventory, SPDX SBOM, and GitHub artifact attestations. | [Release procedure](RELEASES.md) |
| Static analysis | CodeQL runs on pull requests, main, and a weekly schedule. | `.github/workflows/codeql.yml` |
| Repository controls | Pinned dependency review runs on pull requests; OpenSSF Scorecard results remain inside GitHub code scanning. | `.github/workflows/dependency-review.yml`; `.github/workflows/scorecard.yml` |
| Telemetry | None in the verifier, CLI, Action, or digest adapter. | [Privacy boundary](../PRIVACY_BOUNDARY.md) |

## Customer-controlled decisions

The customer selects trusted issuers, public keys, status freshness, protected
variables, required conditions, repository rulesets, reviewers, retention, and
failure handling. A cryptographically authentic envelope is not proof that its
evidence is true or that the change is safe, compliant, or authorized outside
the exact signed scope.

## Items requiring written confirmation

Do not infer hosted-service commitments from the public verifier. Confirm
applicable availability targets, support response times, data residency,
subprocessors, contractual retention, incident notification, identity
management, private deployment, and legal terms before procurement. Features
not stated in the current contract are not promised.
