# Changelog

## Unreleased

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
