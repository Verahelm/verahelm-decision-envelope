# Opt-in aggregate measurement

Verahelm does not enable telemetry in the verifier, Action, CLI, or adapter.
This optional local tool prepares aggregate pilot evidence from explicitly
consented contributions.

## Collection boundary

The contribution contract accepts only:

- setup time in seconds;
- whether stale-decision reuse was prevented;
- whether repeated verification was consistent;
- whether verification completed successfully;
- a coarse willingness-to-pay response;
- consent version and a one-study random contribution identifier.

It rejects unknown fields. Do not add names, organizations, account IDs,
envelope contents, evidence, conditions, source code, repository names,
customer decisions, timestamps, IP addresses, or private engine data.

Consent must be affirmative and separate from product access. Declining has no
product consequence. A participant may request deletion before aggregation by
providing the one-study contribution identifier.

## Local aggregation

```bash
node adapters/measurement-aggregate.mjs examples/measurement/fictional-contributions.json
```

Expected fictional output:

```json
{"status":"aggregate","schema_version":"1.0","contributors":10,"metrics":{"setup_time_seconds":{"count":10,"median":232.5},"stale_decision_reuse_prevented":{"count":10,"rate":0.5},"verification_consistency":{"count":10,"rate":1},"verification_reliability":{"count":10,"rate":1},"willingness_to_pay":{"count":10,"yes_rate":0.5}}}
```

The tool reads one bounded local JSON file, makes no network request, writes no
file, and emits no contributor identifier. A cohort or individual metric with
fewer than ten responses is suppressed. It does not segment results.

## Handling procedure

1. Display the notice version, fields, purpose, retention, and deletion route.
2. Record a contribution only after affirmative consent.
3. Keep raw contributions encrypted in an owner-approved restricted system.
4. Limit access to the named study operators.
5. Delete raw working copies immediately after the approved aggregate is
   accepted; in every case delete within 30 days unless an owner/counsel hold
   requires otherwise.
6. Record deletion and review temporary files, backups, logs, and caches.
7. Publish only aggregates that meet the threshold and have received privacy
   review.

The 30-day limit is an operating maximum, not a legal-retention conclusion.
Owner and counsel must approve the notice, systems, retention, and publication
for a real study.

## Metric definitions

| Metric | Definition |
|---|---|
| Setup time | Elapsed seconds from starting the documented integration to the first completed fictional verification. |
| Stale reuse prevented | A configured gate rejected reuse of a decision outside its signed lifecycle or binding. |
| Verification consistency | Repeated verification of identical bytes, trust input, status input, and time produced the same result. |
| Verification reliability | The verification command completed and returned a documented result rather than an operational error. |
| Willingness to pay | Participant response to a stated plan and price; it is not a purchase or revenue result. |

Measured aggregates, estimates, and testimonials must be labeled separately.
No baseline or outcome is asserted by this repository.
