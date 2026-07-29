# Public verifier threat model

## Protected properties

- exact subject and version binding;
- exact authority, environment, and change binding when expected values are
  supplied;
- integrity of signed fields;
- fail-closed handling of malformed, blocked, expired, revoked, superseded, or tampered objects;
- absence of network and subprocess execution;
- exclusion of raw evidence and private implementation material.

## In scope

Field injection, duplicate JSON keys, invalid UTF-8, unknown properties,
signature substitution, trust-key replacement, private-key input, payload
modification, future issuance, stale signed status when a maximum age is
configured, ambiguous subject versions, malicious local files, and accidental
repository disclosure.

## Out of scope

Compromised trusted signing keys, dishonest authorities, false source evidence,
endpoint compromise, host compromise, status freshness when no maximum age is
configured, trustworthiness of configured authority or scope values, and
enforcement of signed conditions by downstream systems.

The verifier parses one bounded JSON document and one Ed25519 public key. It does not dereference evidence or execute supplied content.
