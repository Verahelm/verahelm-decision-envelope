# Release procedure

Releases use semantic versioning.

No signed package release has been issued. Repository source is available at
immutable commit references; a tag or GitHub Release must not be treated as
organization-signed provenance unless its signature is independently verified.

1. Run `npm test` in a clean directory without `.git`.
2. Confirm every file appears in `PUBLIC_RELEASE_MANIFEST.md`.
3. Generate and review SHA-256 checksums and the SPDX SBOM.
4. Create an annotated tag from the reviewed full commit SHA.
5. Sign the tag and checksum file with the organization-controlled release key.
6. Publish immutable references and attestations only after signature verification.

Consumers should pin the Action to the full 40-character commit SHA:

```yaml
- uses: Verahelm/verahelm-decision-envelope@687242490be7bd3e41def2dbd75d3bb29d0a4def
```

The pin identifies the reviewed Action implementation. Documentation-only
commits do not change it; any Action implementation change requires a new
reviewed immutable pin.

The complete subject-binding and verification workflow is in
[`template/verahelm-change-gate.yml`](../template/verahelm-change-gate.yml).
