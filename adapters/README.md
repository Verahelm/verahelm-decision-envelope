# Evidence adapters

The public adapter hashes an existing evidence artifact without parsing, uploading, or retaining it:

```bash
node adapters/evidence-digest.mjs sarif results.sarif
node adapters/evidence-digest.mjs junit junit.xml
node adapters/evidence-digest.mjs opa decision.json
node adapters/evidence-digest.mjs eval_report synthetic-eval.json
node adapters/evidence-digest.mjs artifact artifact.bin
node adapters/evidence-digest.mjs attestation provenance.json
```

Additional labels are available for `cyclonedx`, `in_toto`, `promptfoo`,
`sigstore`, `slsa`, and `spdx`. Labels describe the producer format; the
adapter still hashes bytes only.

The output is a public `evidence_ref` containing only a type and SHA-256 digest. The adapter does not claim that the artifact is correct, sufficient, independent, or safe to disclose. Keep the underlying artifact under your own access controls.
