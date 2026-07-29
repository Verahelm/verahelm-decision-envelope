// SPDX-License-Identifier: Apache-2.0
import { readFile, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { parseJsonStrict } from "../verifier/json.mjs";

export const minimumContributors = 10;
const rootKeys = ["schema_version", "contribution_id", "consent", "metrics"];
const metricKeys = [
  "setup_time_seconds",
  "stale_decision_reuse_prevented",
  "verification_consistent",
  "verification_succeeded",
  "willingness_to_pay"
];

function exactKeys(value, allowed) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === allowed.length &&
    Object.keys(value).every((key) => allowed.includes(key));
}

function validContribution(value) {
  if (!exactKeys(value, rootKeys) || value.schema_version !== "1.0") return false;
  if (!/^fictional-[0-9]{2}$|^c_[0-9a-f]{32}$/u.test(value.contribution_id)) return false;
  if (!exactKeys(value.consent, ["granted", "notice_version"]) ||
      value.consent.granted !== true || value.consent.notice_version !== "1.0") return false;
  if (!value.metrics || typeof value.metrics !== "object" || Array.isArray(value.metrics)) return false;
  const keys = Object.keys(value.metrics);
  if (keys.length === 0 || !keys.every((key) => metricKeys.includes(key))) return false;
  const metrics = value.metrics;
  if (metrics.setup_time_seconds !== undefined &&
      (!Number.isInteger(metrics.setup_time_seconds) ||
       metrics.setup_time_seconds < 1 || metrics.setup_time_seconds > 86400)) return false;
  for (const key of [
    "stale_decision_reuse_prevented",
    "verification_consistent",
    "verification_succeeded"
  ]) {
    if (metrics[key] !== undefined && typeof metrics[key] !== "boolean") return false;
  }
  if (metrics.willingness_to_pay !== undefined &&
      !["yes", "unsure", "no", "declined"].includes(metrics.willingness_to_pay)) return false;
  return true;
}

function rate(values) {
  return Number((values.filter(Boolean).length / values.length).toFixed(2));
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(1));
}

export function aggregateContributions(contributions) {
  if (!Array.isArray(contributions) || contributions.length > 10000 ||
      !contributions.every(validContribution)) throw new Error("invalid_contribution");
  const ids = contributions.map((value) => value.contribution_id);
  if (new Set(ids).size !== ids.length) throw new Error("duplicate_contribution");
  if (contributions.length < minimumContributors) {
    return {
      status: "suppressed",
      reason: "minimum_contributors",
      minimum: minimumContributors
    };
  }

  const values = (key) => contributions
    .map((value) => value.metrics[key])
    .filter((value) => value !== undefined);
  const output = {};

  const setup = values("setup_time_seconds");
  if (setup.length >= minimumContributors) {
    output.setup_time_seconds = { count: setup.length, median: median(setup) };
  }
  for (const [key, label] of [
    ["stale_decision_reuse_prevented", "stale_decision_reuse_prevented"],
    ["verification_consistent", "verification_consistency"],
    ["verification_succeeded", "verification_reliability"]
  ]) {
    const metric = values(key);
    if (metric.length >= minimumContributors) {
      output[label] = { count: metric.length, rate: rate(metric) };
    }
  }
  const payment = values("willingness_to_pay");
  if (payment.length >= minimumContributors) {
    output.willingness_to_pay = {
      count: payment.length,
      yes_rate: Number((payment.filter((value) => value === "yes").length / payment.length).toFixed(2))
    };
  }

  if (Object.keys(output).length === 0) {
    return {
      status: "suppressed",
      reason: "minimum_metric_responses",
      minimum: minimumContributors
    };
  }
  return {
    status: "aggregate",
    schema_version: "1.0",
    contributors: contributions.length,
    metrics: output
  };
}

async function run(path) {
  const metadata = await stat(path);
  if (!metadata.isFile() || metadata.size < 2 || metadata.size > 1024 * 1024) {
    throw new Error("invalid_file");
  }
  return aggregateContributions(parseJsonStrict(await readFile(path, "utf8")));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv[2]).then((value) => {
    process.stdout.write(`${JSON.stringify(value)}\n`);
  }).catch(() => {
    process.stderr.write("measurement_error\n");
    process.exitCode = 65;
  });
}
