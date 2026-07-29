# Limitations

- Verification proves contract conformance and signature validity, not the truth or sufficiency of referenced evidence.
- `pass` is a bounded declared authorization state. It is not a safety, compliance, certification, or deployment claim.
- Offline verification can observe revocation or supersession only when those
  fields are present in the supplied signed object. Consumers needing current
  status must obtain a newer trusted object outside this verifier and configure
  `status-max-age-seconds`; otherwise an authentic but old active status may
  remain acceptable until envelope expiry.
- Conditions are returned as signed data; the consuming system must enforce them.
- Key distribution, rotation, validation of trusted authority and scope
  configuration, and key-retirement policy are deployment responsibilities. A
  pull-request gate must pin these values outside pull-request-controlled
  content.
- The public verifier accepts one current Ed25519 trust key. Multi-key bundles,
  overlapping rotation windows, one-time consumption, and replay ledgers are not
  implemented.
- The public canonicalization profile is intentionally narrow and may change only under the versioning policy.
- The fixtures are fictional and provide no information about production behavior.
