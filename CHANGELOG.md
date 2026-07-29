# Changelog

## Unreleased

## 0.6.0 — 2026-07-28

- Added bounded `status` and string-boolean `valid` Action outputs.
- Preserved fail-closed exits and restricted outputs to coarse public values.
- Added public blocked and passing pull-request checks.
- Documented every Action input, output, permission, exit, and trust boundary.

## 0.5.0 — 2026-07-28

- Added a literal clean-checkout demonstration with exact fictional output.
- Added a pinned least-privilege release workflow, deterministic source archive,
  SHA-256 inventory, SPDX SBOM, source-commit receipt, and GitHub build
  attestations.
- Enabled immutable GitHub releases so published tags and assets cannot be
  changed in place.
- Added a static repository preview aligned with the website visual system.
- Clarified the current release-signing status and Discussions channel.
- Rejected private-key input, duplicate JSON keys, invalid UTF-8, and stale signed status when a freshness policy is configured.
- Aligned timestamp schemas with verifier precision and corrected post-expiry status handling.
- Removed caller-selectable verification time from the GitHub Action.

## 0.4.0 — 2026-07-28

- Added an offline verification quickstart and pull-request workflow.
- Separated API, schema, verifier-kit, Action, and public-code version streams.
- Added lifecycle verification for expiry, revocation, and supersession.
- Defined the public-code license and private implementation boundary.
- Bound the pull-request trust key to an independently configured SHA-256 fingerprint.
- Expanded the first-party-sourced category comparison and documented where Verahelm is narrower.
- Added local key fingerprinting and digest references for attestations and artifacts.
- Documented GitHub ruleset, deployment-protection, and provenance integration boundaries.

## 0.3.0 — 2026-07-28

Initial public release candidate:

- Offline Decision Envelope validation and verification.
- Signed revocation and supersession verification, JWK support, and documented exit codes.
- Minimal-permission verification-only Action and fictional lifecycle fixtures.
- Digest-only local evidence adapters.
- Exact plan limits and operation-unit policy.
- Default-deny allowlist, checksums, and disclosure gates.
