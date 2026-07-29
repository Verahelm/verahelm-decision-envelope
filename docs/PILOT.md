# Pull-request gate pilot

This pilot evaluates whether a signed, revision-bound decision record improves
one existing pull-request review workflow. It does not require production
deployment or disclosure of repository content.

## Scope

- One private, non-production repository.
- One change class already reviewed by a person.
- The `agent_change_gate` profile.
- Five to ten fictional or non-confidential changes.
- Two weeks or twenty completed reviews, whichever occurs first.

Do not submit source, prompts, traces, files, datasets, customer records,
credentials, or confidential text. Use the structured fields documented by the
[hosted API](https://www.verahelm.com/api-docs).

## Start

1. Run the [local fictional demo](../README.md#five-minute-quick-start).
2. Add the verification-only Action to a non-required test workflow.
3. [Request a non-production testing key](https://www.verahelm.com/access#testing-key).
4. Issue a Decision Envelope through the documented hosted profile.
5. Configure exact revision, authority, scope, key fingerprint, and signed
   status freshness outside pull-request control.
6. Promote the check to a required rule only after the team reviews failure,
   expiry, revocation, and recovery behavior.

The Action verifies an envelope. GitHub rulesets enforce the merge requirement.
Neither component reviews code or establishes that caller-supplied evidence is
true.

## Measures

Record the same measures before and during the pilot:

| Measure | Definition |
|---|---|
| Review time | Minutes from review-ready to recorded decision. |
| Setup time | Minutes from starting integration to the first fictional verification. |
| Binding failures | Attempts to reuse a decision for a different revision, scope, or authority. |
| Stale reuse prevented | Expired, revoked, or superseded records rejected before merge. |
| Decision consistency | Identical inputs and trust material produce the same verifier result. |
| Integration burden | Engineer-hours required to install, operate, and troubleshoot the gate. |
| Willingness to pay | Decision against the stated plan and price after the pilot. |

Use the optional [local aggregate tool](MEASUREMENT.md) only after affirmative
consent. It has no telemetry and suppresses cohorts below ten contributors.

## Exit criteria

Continue only when:

- the team can reproduce pass and blocked paths;
- bindings and lifecycle failures are understandable;
- no confidential payload is required;
- review time or stale-decision control improves enough to justify operation;
- the buyer confirms a paid plan is plausible.

Stop when integration cost exceeds the observed benefit, a required trust
control is missing, users cannot recover safely from failures, or the buyer
would replace the workflow with an internal rule.

Report defects through the private security channel when appropriate. Public
issues must contain no real envelope, evidence, key, customer identifier, or
private decision result.
