# Evidence-producer integration

Decision Envelopes complement evidence producers. The local adapter emits a
SHA-256 reference; it does not copy, parse, upload, retain, or judge the
artifact.

| Producer class | Public-safe input | Envelope binding |
|---|---|---|
| Evaluation and testing | Immutable report digest; suite identifier; tested subject version | `evidence_refs`, `subject.version` |
| Observability | Digest of a bounded export or incident record | `evidence_refs`, `scope` |
| Runtime security | Finding or policy-result digest | `evidence_refs`, `decision.conditions` |
| Governance and GRC | Customer authority reference; approved scope | `authority`, `scope` |
| Policy and provenance | Policy-result, attestation, or artifact digest | `evidence_refs`, `subject.version` |
| Repository scanning | Scan-result and commit digest | `evidence_refs`, `subject.version` |

An adapter must:

1. accept only the minimum public-safe fields;
2. normalize an immutable subject version;
3. hash the bounded evidence record locally;
4. avoid embedding evidence, credentials, URLs with secrets, prompts, logs, or personal data;
5. fail closed when required bindings are absent.

Adapter requests must use fictional field examples.

The included [`evidence-digest` adapter](../adapters/README.md) supports local
digest references for common producer formats. These are example mappings, not
native producer integrations. Validate the artifact with its native verifier
first, then hash the exact retained bytes.

## Tested digest recipes

All commands below run offline against fictional files in this repository.

### Promptfoo

After Promptfoo writes its documented result file:

```bash
node adapters/evidence-digest.mjs promptfoo examples/integrations/promptfoo-result.json
```

Expected output:

```json
{"kind":"promptfoo","digest":"sha256:819263ee86eff5644796c5460e3315402490773e699af160a7384144fd281344"}
```

Trust boundary: Promptfoo produces the evaluation result; this adapter binds
bytes only. See the [Promptfoo CLI documentation](https://www.promptfoo.dev/docs/usage/command-line/).

### Open Policy Agent

After OPA evaluates the applicable policy:

```bash
node adapters/evidence-digest.mjs opa examples/integrations/opa-result.json
```

Expected output:

```json
{"kind":"opa","digest":"sha256:3a9c41dcd5ac2b5d8af28aa35cdfa07599c4e077121e7d217a5220c2acb2c093"}
```

Trust boundary: OPA owns policy evaluation and its result semantics; this
adapter does not re-evaluate Rego. See [OPA CI/CD guidance](https://www.openpolicyagent.org/docs/cicd).

### SARIF

After the scanner validates and writes SARIF 2.1.0:

```bash
node adapters/evidence-digest.mjs sarif examples/integrations/report.sarif.json
```

Expected output:

```json
{"kind":"sarif","digest":"sha256:f0ac3e23093fe41fd0f62568e97a330040d93c29d06864ddaca6e90637eb85ad"}
```

Trust boundary: the scanner and consumer own SARIF correctness and severity
semantics. The adapter binds the report bytes. See the
[SARIF 2.1.0 specification](https://docs.oasis-open.org/sarif/sarif/v2.1.0/os/sarif-v2.1.0-os.html).

### Sigstore bundle reference

Verify a bundle with Sigstore tooling before creating the retained reference:

```bash
node adapters/evidence-digest.mjs sigstore examples/integrations/sigstore-bundle-reference.json
```

Expected output:

```json
{"kind":"sigstore","digest":"sha256:0d459cea224e285ddbfaa631ec573044f263c0b52687f1a75f26ef88fae8472e"}
```

Trust boundary: native Sigstore verification establishes bundle authenticity;
the adapter only binds a fictional local reference record. See
[Sigstore bundles](https://docs.sigstore.dev/about/bundle/).

### SLSA provenance reference

Verify provenance and builder policy before hashing the retained reference:

```bash
node adapters/evidence-digest.mjs slsa examples/integrations/slsa-provenance-reference.json
```

Expected output:

```json
{"kind":"slsa","digest":"sha256:21966cdc9e64450da2a0f6c61d94fa2652002acba10baf709db8e3f59c2702bc"}
```

Trust boundary: the provenance verifier establishes authenticity and policy
acceptance. This adapter does not establish an SLSA level. See
[SLSA provenance 1.1](https://slsa.dev/spec/v1.1/provenance).

For every recipe, a missing, empty, oversized, or unsupported input fails
without producing a digest. A digest proves byte identity only; it does not
prove truth, safety, policy acceptance, or evidence sufficiency.

## GitHub change enforcement

Use [`template/verahelm-change-gate.yml`](../template/verahelm-change-gate.yml)
as a required status check in a GitHub ruleset. Verahelm verifies the signed
record; the ruleset enforces whether the pull request may merge. Keep the
workflow definition, trusted key fingerprint, and required-check configuration
outside pull-request control.

GitHub environments and deployment protection rules remain the deployment
enforcement layer. A passing Decision Envelope is evidence for that workflow;
it does not replace required reviewers, environment restrictions, or custom
deployment protection rules.

## Attestations and provenance

An in-toto statement, SLSA provenance file, Sigstore bundle, or GitHub artifact
attestation can remain in its existing system. Verify it with its native tool,
then create a local digest reference:

```bash
node adapters/evidence-digest.mjs attestation provenance.json
```

The adapter hashes bytes only. It does not validate provenance, signatures,
builder identity, policy, or evidence sufficiency.
