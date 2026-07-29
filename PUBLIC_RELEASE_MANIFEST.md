# Public release manifest

Candidate: `verahelm-decision-envelope-public` 0.6.0
Boundary: explicit allowlist; default deny; no repository history.

## Allowlist

Only these paths may enter the public repository:

```text
.github/ISSUE_TEMPLATE/adapter.yml
.github/ISSUE_TEMPLATE/bug.yml
.github/ISSUE_TEMPLATE/config.yml
.github/PULL_REQUEST_TEMPLATE.md
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
cli/verahelm.mjs
demo-pr/README.md
docs/ARCHITECTURE.md
docs/ACTION.md
docs/CLI.md
docs/COMPARISON.md
docs/INTEGRATIONS.md
docs/LIMITATIONS.md
docs/RELEASES.md
docs/ROADMAP.md
docs/assets/repository-preview.svg
docs/index.md
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
template/README.md
template/verahelm-change-gate.yml
tests/cli.mjs
tests/conformance.mjs
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
- The exact file set equals this allowlist; additions fail closed.
- All JSON parses; all seven fixtures are fictional and pass the applicable contract or lifecycle test.
- Release gate: `node tests/release-gate.mjs`.
- Conformance gate: `node tests/conformance.mjs`.

Publication remains an owner-controlled action after private release review.
