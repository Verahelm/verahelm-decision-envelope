# Verahelm Decision Envelope v0.5.0

This is the first checksummed and attested distribution of the public verifier
and integration kit.

Included:

- offline schema, signature, lifecycle, and context-binding verification;
- a verification-only GitHub Action;
- fictional conformance fixtures;
- a local CLI and digest-only adapter;
- a five-minute fictional demonstration.

The release does not contain Verahelm's hosted decision engine, private methods,
customer material, or real engine output. Verification authenticates the
published envelope and its declared bindings; it does not establish that the
underlying evidence is true or sufficient.

## Verify

```bash
gh release download v0.5.0 --repo Verahelm/verahelm-decision-envelope
sha256sum --check SHA256SUMS
gh attestation verify verahelm-decision-envelope-0.5.0.tar.gz --repo Verahelm/verahelm-decision-envelope
```

`SOURCE_COMMIT` identifies the exact source revision. The immutable GitHub
release attestation binds the tag, source commit, and attached assets. The
additional build attestation records the release workflow that produced them.
