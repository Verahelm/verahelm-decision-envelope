import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  aggregateContributions,
  minimumContributors
} from "../adapters/measurement-aggregate.mjs";

const root = resolve(new URL("../", import.meta.url).pathname);
const contributions = JSON.parse(await readFile(
  resolve(root, "examples/measurement/fictional-contributions.json"),
  "utf8"
));
const result = aggregateContributions(contributions);
assert.deepEqual(result, {
  status: "aggregate",
  schema_version: "1.0",
  contributors: 10,
  metrics: {
    setup_time_seconds: { count: 10, median: 232.5 },
    stale_decision_reuse_prevented: { count: 10, rate: 0.5 },
    verification_consistency: { count: 10, rate: 1 },
    verification_reliability: { count: 10, rate: 1 },
    willingness_to_pay: { count: 10, yes_rate: 0.5 }
  }
});
assert.deepEqual(aggregateContributions(contributions.slice(0, 9)), {
  status: "suppressed",
  reason: "minimum_contributors",
  minimum: minimumContributors
});
assert.throws(
  () => aggregateContributions([...contributions, contributions[0]]),
  /duplicate_contribution/
);
assert.throws(
  () => aggregateContributions([{
    ...contributions[0],
    source_code: "excluded"
  }]),
  /invalid_contribution/
);
assert.throws(
  () => aggregateContributions([{
    ...contributions[0],
    consent: { granted: false, notice_version: "1.0" }
  }]),
  /invalid_contribution/
);
assert.equal(JSON.stringify(result).includes("contribution_id"), false);

process.stdout.write(
  `measurement=pass minimum=${minimumContributors} telemetry=none identifiers_output=none\n`
);
