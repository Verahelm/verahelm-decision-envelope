# Versioning policy

Verahelm versions public surfaces independently. Similar numbers do not imply a coupled release.

| Stream | Current public identifier | Compatibility boundary |
|---|---|---|
| Hosted API contract | OpenAPI `1.4.0`; base path `v1` | Request and response contract |
| Decision Envelope schema | `1.0.0` | Canonicalization, signature, binding, and lifecycle fields |
| Verifier and integration kit | `0.9.0` | CLI, verifier, package, fixtures, documentation, and adapters |
| GitHub Action | `0.6.0` | Action inputs, outputs, runtime, and exit behavior |
| Public result/code vocabulary | Returned `code_set_version`; schema `VH_PUBLIC_RESULT_V1` | Meanings of documented public result codes |

The schema, verifier kit, and Action use semantic versioning:

- Patch: correction that does not change accepted objects or result meaning.
- Minor: backward-compatible optional behavior or public artifact.
- Major: changed canonicalization, required field, signature contract, Action input, or status semantics.

The hosted API may publish a new OpenAPI document without changing the `v1` base path when compatibility is preserved. A response identifies its own ruleset, code set, and schema versions.

A verifier rejects unsupported schema versions and undeclared fields. Deprecations identify the last supported version and a removal date. Security fixes may shorten normal notice when continued support creates material risk.
