# Zero-install CLI route

The CLI is distributed as a dependency-free package attached to the immutable
GitHub release. No npm-registry package is claimed: the organization namespace
was not authenticated in the release environment, so registry ownership remains
unverified.

Run the version-pinned package without cloning or installing it globally:

```bash
npm exec --yes --ignore-scripts --package=https://github.com/Verahelm/verahelm-decision-envelope/releases/download/v0.10.0/verahelm-decision-envelope-0.10.0.tgz -- verahelm-envelope demo
```

Expected fictional output:

```json
{"status":"demo_complete","results":[{"fixture":"pass","status":"pass"},{"fixture":"blocked","status":"blocked"},{"fixture":"expired","status":"expired"},{"fixture":"tampered","status":"tampered"}]}
```

Package retrieval uses the network. Envelope verification itself remains
offline and invokes no subprocess. The package has no runtime dependencies and
defines no install, preinstall, postinstall, or prepare script.

## Verify before execution

```bash
gh release download v0.10.0 --repo Verahelm/verahelm-decision-envelope
sha256sum --check SHA256SUMS
gh attestation verify verahelm-decision-envelope-0.10.0.tgz --repo Verahelm/verahelm-decision-envelope
npm exec --ignore-scripts --package=./verahelm-decision-envelope-0.10.0.tgz -- verahelm-envelope demo
```

The immutable release and attestation identify the exact source commit and
builder. They do not establish the truth or sufficiency of evidence referenced
by an envelope.

Supported environments are Node.js 20, 22, and 24 on current GitHub-hosted
Ubuntu, macOS, and Windows runners. CLI exit codes remain those documented in
[the CLI contract](CLI.md).

Upgrades are explicit: replace both occurrences of `0.10.0`, reverify the new
release, and review its changelog before use.
