# Verahelm Decision Envelope v0.8.1

This release adds public-safe interoperability recipes, stronger disclosure
gates, local aggregate pilot measurement, and Node.js 24-based workflow pins.

Included:

- offline schema, signature, lifecycle, and context-binding verification;
- a verification-only GitHub Action;
- fictional conformance fixtures;
- a local CLI and digest-only adapter;
- a five-minute fictional demonstration;
- bounded `status` and string-boolean `valid` Action outputs;
- a dependency-free CLI package with no lifecycle scripts.
- tested digest-only mappings for Promptfoo, OPA, SARIF, Sigstore references,
  and SLSA provenance references;
- a documented DSSE and in-toto semantic mapping;
- a local, opt-in, aggregate-only measurement tool;
- in-memory negative controls for the default-deny release boundary.

The release does not contain Verahelm's hosted decision engine, private methods,
customer material, or real engine output. Verification authenticates the
published envelope and its declared bindings; it does not establish that the
underlying evidence is true or sufficient.

## Verify

```bash
gh release download v0.8.1 --repo Verahelm/verahelm-decision-envelope
sha256sum --check SHA256SUMS
gh attestation verify verahelm-decision-envelope-0.8.1.tar.gz --repo Verahelm/verahelm-decision-envelope
gh attestation verify verahelm-decision-envelope-0.8.1.tgz --repo Verahelm/verahelm-decision-envelope
```

`SOURCE_COMMIT` identifies the exact source revision. The immutable GitHub
release attestation binds the tag, source commit, and attached assets. The
additional build attestation records the release workflow that produced them.
