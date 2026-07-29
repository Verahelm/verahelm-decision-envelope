# Public disclosure checklist

Complete this checklist for every public commit, package, archive, example, and
release. Exclusion is the default when ownership or disclosure status is
uncertain.

- [ ] Synthetic or fictional data only; every identifier and record follows that rule.
- [ ] No customer, production, or derived private data is present.
- [ ] No output or test vector came from the private decision engine.
- [ ] No private rule, threshold, weight, prompt, detector, or decision method is present.
- [ ] No private source, configuration, infrastructure, topology, log, or internal name is present.
- [ ] No credential, private key, access token, personal identifier, or secret-bearing URL is present.
- [ ] Examples expose only the documented public verification contract.
- [ ] Fixtures cannot be combined to infer a private decision boundary.
- [ ] Release bundles contain no Git history, unlisted file, source map, archive, binary, cache, or generated clutter.
- [ ] The exact allowlist, checksums, package contents, metadata, and CI logs were reviewed.
- [ ] Automated conformance and release gates pass from a clean checkout.
- [ ] Owner approval is recorded before publication.

Automated scans reduce error; they do not determine conceptual, intellectual-
property, privacy, or legal safety. A human release review remains required.
