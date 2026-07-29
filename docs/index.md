---
title: Verahelm Decision Envelope
---

# AI change gates for pull requests

Verahelm records change authority in a signed Decision Envelope bound to a
subject version, scope, conditions, and expiry.

The public package validates these envelopes locally. It does not contain or
reproduce the hosted decision engine.

```bash
node cli/verahelm.mjs demo
node cli/verahelm.mjs validate fixtures/pass.json
node cli/verahelm.mjs verify fixtures/pass.json --key fixtures/fixture-public-key.pem
```

[Marketplace Action](https://github.com/marketplace/actions/verahelm-decision-envelope-verifier) · [Pinned workflow](../README.md#add-the-verifier-to-a-pull-request) · [Pilot](PILOT.md) · [Enterprise review](ENTERPRISE_REVIEW.md) · [Specification](../SPECIFICATION.md) · [Integration recipes](INTEGRATIONS.md) · [Standards mapping](INTEROPERABILITY.md) · [Opt-in measurement](MEASUREMENT.md) · [Threat model](../THREAT_MODEL.md) · [Privacy boundary](../PRIVACY_BOUNDARY.md) · [API documentation](https://www.verahelm.com/api-docs)
