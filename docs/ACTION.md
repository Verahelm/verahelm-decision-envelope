# GitHub Action contract

The Verahelm Decision Envelope verifier Action performs offline verification
only. It does not call Verahelm's hosted service, issue a decision, execute
pull-request code, or send envelope data over the network.

## Minimal use

The semantic tag is convenient and immutable for this release:

```yaml
- uses: Verahelm/verahelm-decision-envelope@v0.5.0
  with:
    envelope: decision-envelope.json
    public-key: decision-envelope-public-key.pem
    public-key-sha256: ${{ vars.VERAHELM_PUBLIC_KEY_SHA256 }}
    subject-id: ${{ github.repository }}
    subject-version: ${{ steps.subject.outputs.version }}
    authority-id: ${{ vars.VERAHELM_AUTHORITY_ID }}
    scope-environment: ${{ vars.VERAHELM_SCOPE_ENVIRONMENT }}
    scope-change: pull-request-${{ github.event.pull_request.number }}
```

For maximum source pinning, use the full release commit:

```yaml
- uses: Verahelm/verahelm-decision-envelope@e8fd6ca983fc40132c166ce0f79c6918add091e1
```

The immutable semantic tag cannot be moved while its release exists. A full
commit SHA remains the clearest source identity and is preferred by automated
dependency update policies.

## Inputs

| Input | Required | Default | Meaning |
|---|---:|---|---|
| `envelope` | Yes | None | Repository-relative path to one Decision Envelope. |
| `public-key` | Yes | None | Repository-relative path to one Ed25519 public key. |
| `public-key-sha256` | Yes | None | Trusted `sha256:` fingerprint configured outside pull-request content. |
| `status` | No | None | Repository-relative path to one signed lifecycle-status document. |
| `status-max-age-seconds` | No | None | Maximum accepted signed-status age; requires `status`. |
| `subject-id` | Yes | None | Expected subject identifier from workflow context. |
| `subject-version` | Yes | None | Expected immutable `sha256:` subject version. |
| `authority-id` | Yes | None | Expected customer authority from trusted configuration. |
| `scope-environment` | Yes | None | Expected environment from trusted configuration. |
| `scope-change` | Yes | None | Expected change identifier from workflow context. |

Version 0.5.0 defines no Action outputs. A passing verification exits zero.
Blocked, expired, revoked, superseded, tampered, mismatched, unsupported, and
invalid inputs exit one. Logs contain only a bounded status label or the generic
message `invalid input`; they do not print the envelope, conditions, evidence,
subject, authority, scope, key, or raw verifier errors.

## Permissions and event safety

```yaml
permissions:
  contents: read
```

Use the base-controlled
[`pull_request_target` template](../template/verahelm-change-gate.yml). It
checks out no pull-request code and disables credential persistence. The
trusted key fingerprint, authority, and environment must come from protected
repository configuration, never from pull-request content.

The consuming workflow remains responsible for enforcing declared conditions
and obtaining a sufficiently fresh signed status when later revocation or
supersession matters. A valid signature does not prove that underlying evidence
is true or sufficient.
