# Public release manifest

Candidate: `verahelm-decision-envelope-public` 0.9.0
Boundary: explicit allowlist; default deny; no repository history.

## Allowlist

Only these paths may enter the public repository:

```text
.github/ISSUE_TEMPLATE/adapter.yml
.github/ISSUE_TEMPLATE/bug.yml
.github/ISSUE_TEMPLATE/config.yml
.github/ISSUE_TEMPLATE/pilot.yml
.github/PULL_REQUEST_TEMPLATE.md
.github/dependabot.yml
.github/workflows/codeql.yml
.github/workflows/package.yml
.github/workflows/release.yml
.github/workflows/verify.yml
CHANGELOG.md
CITATION.cff
CODE_OF_CONDUCT.md
CONTRIBUTING.md
GOVERNANCE.md
LICENSE
LICENSES/Apache-2.0.txt
PRIVACY_BOUNDARY.md
PUBLIC_DISCLOSURE_CHECKLIST.md
PUBLIC_RELEASE_MANIFEST.md
README.md
SECURITY.md
SPECIFICATION.md
SUPPORT.md
THREAT_MODEL.md
VERSIONING.md
_config.yml
action.yml
action/index.mjs
adapters/README.md
adapters/evidence-digest.mjs
adapters/measurement-aggregate.mjs
cli/verahelm.mjs
demo-pr/README.md
docs/ARCHITECTURE.md
docs/ACTION.md
docs/CLI.md
docs/COMPARISON.md
docs/ENTERPRISE_REVIEW.md
docs/INTEGRATIONS.md
docs/INTEROPERABILITY.md
docs/LIMITATIONS.md
docs/MEASUREMENT.md
docs/PACKAGE.md
docs/PILOT.md
docs/RELEASES.md
docs/ROADMAP.md
docs/assets/repository-preview.svg
docs/index.md
examples/integrations/opa-result.json
examples/integrations/promptfoo-result.json
examples/integrations/report.sarif.json
examples/integrations/sigstore-bundle-reference.json
examples/integrations/slsa-provenance-reference.json
examples/interoperability/in-toto-envelope-reference.json
examples/measurement/fictional-contributions.json
fixtures/blocked.json
fixtures/expired.json
fixtures/fixture-public-key.json
fixtures/fixture-public-key.pem
fixtures/pass.json
fixtures/revoked-status.json
fixtures/superseded-status.json
fixtures/tampered.json
package.json
release/SBOM.spdx.json
release/RELEASE_NOTES.md
release/REPRODUCIBLE_BUILD.md
release/SHA256SUMS
schemas/decision-envelope.schema.json
schemas/decision-status.schema.json
schemas/measurement-contribution.schema.json
template/README.md
template/verahelm-change-gate.yml
tests/cli.mjs
tests/conformance.mjs
tests/integrations.mjs
tests/measurement.mjs
tests/package.mjs
tests/properties.mjs
tests/release-gate.mjs
verifier/json.mjs
verifier/verify.mjs
```

Anything not listed is excluded.

## Origins

- Documentation, schema, verifier, Action, and tests were authored in a new clean directory for this release.
- Fixtures use fictional identifiers and digests. Their Ed25519 key pair was generated solely for conformance; only the public key and signatures are retained.
- Official comparison sources were checked on 2026-07-28 and are linked directly.
- No private repository was copied, forked, filtered, converted, or initialized here.

## Denylist

Excluded categories include private methods, scoring, rules, thresholds, weights, prompts, detector logic, internal names, source, configuration, infrastructure, topology, production behavior, credentials, logs, customer material, real or derived data, private analysis, pricing drafts, archives, caches, source maps, binaries, package artifacts, and Git history.

## Leak checks

- No `.git`, VCS metadata, symlink, executable file, archive, source map, binary, dependency directory, or build output.
- No network or subprocess capability in executable JavaScript.
- No private key or common credential pattern.
- No suspicious high-entropy value assigned to a credential-like field.
- In-memory negative controls prove representative secret and forbidden-file checks fail closed.
- The exact file set equals this allowlist; additions fail closed.
- All JSON parses; all seven fixtures are fictional and pass the applicable contract or lifecycle test.
- Release gate: `node tests/release-gate.mjs`.
- Conformance gate: `node tests/conformance.mjs`.

Publication remains an owner-controlled action after private release review.
