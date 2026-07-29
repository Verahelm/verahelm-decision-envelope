# Changelog

## Unreleased

## 0.10.1 — 2026-07-29

- Prepared the verified Action for GitHub Marketplace publication without
  changing verifier or Action behavior.
- Added the rendered documentation link and aligned public activation, testing
  allowance, pricing, and integration guidance.

## 0.10.0 — 2026-07-28

- Added an offline, digest-pinned multi-key trust bundle with issuer, key ID,
  and validity-window enforcement.
- Added pinned dependency review and local-only OpenSSF Scorecard analysis.
- Standardized the public distribution on Apache-2.0 while retaining explicit
  private-engine, confidential-material, and trademark boundaries in `NOTICE`.

## 0.9.0 — 2026-07-28

- Added deterministic canonicalization and parser property tests.
- Added pinned CodeQL analysis and weekly GitHub Actions dependency updates.
- Added a bounded pull-request pilot and enterprise technical review sheet.
- Replaced the abstract repository preview with a concrete Decision Envelope
  verification artifact.
- Clarified the Apache-2.0 scope for compatible public verifier
  implementations while preserving the private-engine and trademark boundary.

## 0.8.1 — 2026-07-28

- Updated pinned `actions/checkout` and `actions/setup-node` revisions to their
  current Node.js 24-based releases.

## 0.8.0 — 2026-07-28

- Hardened the default-deny release gate with generated-file, dependency,
  credential-assignment, and negative-control checks.
- Added mechanically tested digest-only recipes for Promptfoo, OPA, SARIF,
  Sigstore references, and SLSA provenance references.
- Added a conservative DSSE and in-toto semantic mapping with explicit
  conversion and lifecycle limits.
- Added an offline opt-in pilot-measurement tool with strict input rejection,
  ten-contributor suppression, and aggregate-only output.

## 0.7.0 — 2026-07-28

- Added a version-pinned zero-install CLI package route.
- Added dependency-free package metadata with no lifecycle scripts.
- Added Ubuntu, macOS, and Windows package tests on Node.js 20, 22, and 24.
- Added the package archive to checksums and GitHub build attestations.

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
