# CLI contract

The CLI has five commands:

| Command | Network | Purpose |
|---|---:|---|
| `demo` | No | Exercise pass, blocked, expired, and tampered fixtures. |
| `validate FILE` | No | Validate the public Decision Envelope contract. |
| `verify ENVELOPE (--key KEY \| --trust-bundle FILE --trust-bundle-sha256 DIGEST) [OPTIONS]` | No | Verify strict JSON, schema, Ed25519 signature, optional expected bindings, lifecycle, status freshness, and declared decision. |
| `explain FILE` | No | Print declared public envelope fields without evaluating them. |
| `fingerprint PUBLIC_KEY` | No | Compute the bounded key-file SHA-256 value used by the GitHub Action trust configuration. |

All commands run locally without network or subprocess access. The CLI does not generate evidence, call the hosted decision service, or contain or approximate Verahelm's private evaluation logic.

Verifier exit codes:

| Code | Meaning |
|---:|---|
| 0 | Valid pass |
| 2 | Valid blocked decision |
| 3 | Expired |
| 4 | Signed revoked status |
| 5 | Signed superseded status |
| 6 | Signature or signed-status tampering |
| 64 | Input, schema, key, or command error |

An exit code of zero means only that the public verification contract passed. It is not a safety, compliance, certification, or deployment finding.

`status-max-age-seconds` requires a signed status document. It measures status
age against the verification time and fails when the signed observation is too
old. Without it, the verifier establishes status authenticity but not freshness.
Expected authority and scope values must come from trusted configuration or
workflow context, not from the envelope being checked.

For customer-controlled key rotation, use an offline trust bundle:

```bash
node cli/verahelm.mjs verify fixtures/pass.json \
  --trust-bundle fixtures/trust-bundle.json \
  --trust-bundle-sha256 sha256:170ad6e7ea18a019e64f1a347f1e3dfd8616c2f93a9bdca560f8ca3280294231 \
  --at 2026-07-27T12:00:00Z
```

The example digest is mechanically checked for the fictional bundle. Store the
approved production digest in protected configuration. Existing `--key`
workflows remain supported.

`--at` exists only for deterministic local testing. The GitHub Action does not
expose a verification-time input and always uses the runner's current time.
