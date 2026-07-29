---
title: Verahelm Decision Envelope
---

# Signed change decisions for pull requests

Verahelm verifies whether a signed authorization record is valid for the exact
pull request or agent change under review.

## Inspect the workflow

- [Fictional blocked pull request](https://github.com/Verahelm/verahelm-decision-envelope-demo/pull/1)
- [Fictional passing pull request](https://github.com/Verahelm/verahelm-decision-envelope-demo/pull/2)
- [Verification Action on GitHub Marketplace](https://github.com/marketplace/actions/verahelm-decision-envelope-verifier)

Both pull requests use prebuilt fictional records. Neither result came from
Verahelm's private engine.

## Run locally

Requires Git and Node.js 20 or later.

```bash
git clone --depth 1 https://github.com/Verahelm/verahelm-decision-envelope.git && cd verahelm-decision-envelope && node cli/verahelm.mjs demo
```

Expected fictional output:

```json
{"status":"demo_complete","results":[{"fixture":"pass","status":"pass"},{"fixture":"blocked","status":"blocked"},{"fixture":"expired","status":"expired"},{"fixture":"tampered","status":"tampered"}]}
```

Successful verification proves schema, signature, lifecycle, and expected
binding checks at verification time. It does not prove the truth or quality of
underlying evidence, issue a hosted decision, or discover a later revocation
without sufficiently fresh signed status.

## Continue

[Pinned workflow](https://github.com/Verahelm/verahelm-decision-envelope#add-the-verifier-to-a-pull-request) · [Testing key](https://www.verahelm.com/access#testing-key) · [Pilot](PILOT.md) · [API documentation](https://www.verahelm.com/api-docs) · [Integration recipes](INTEGRATIONS.md) · [Specification](../SPECIFICATION.md) · [Threat model](../THREAT_MODEL.md) · [Privacy boundary](../PRIVACY_BOUNDARY.md)
