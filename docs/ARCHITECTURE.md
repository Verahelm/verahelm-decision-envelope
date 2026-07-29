# Public architecture boundary

```text
User-controlled evidence references and exact subject version
                         ↓
Optional Verahelm service boundary
                         ↓
Signed Decision Envelope and optional signed status
                         ↓
Public schema and offline verifier
                         ↓
Documented verification result
```

The verifier reads local files, validates the public contract, verifies an
Ed25519 signature, matches an optional freshness policy, and resolves declared
lifecycle state. It makes no network request and starts no subprocess.

The service boundary is intentionally opaque. This repository does not describe internal services, storage, infrastructure, model routing, scoring, prompts, security controls, or deployment topology.

Raw evidence remains in the system chosen by the customer. The public object carries digests and bounded references only.
