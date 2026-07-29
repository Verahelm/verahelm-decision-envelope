import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";

const root = resolve(new URL("../", import.meta.url).pathname);
const textExtensions = new Set(["", ".cff", ".json", ".md", ".mjs", ".pem", ".svg", ".txt", ".yml", ".yaml"]);
const forbiddenNames = [
  /^\.git$/,
  /^\.DS_Store$/,
  /^\.env(?:\.|$)/,
  /^node_modules$/,
  /^dist$/,
  /^coverage$/,
  /^cache$/,
  /^package-lock\.json$/,
  /^npm-debug\.log$/i,
  /(?:\.orig|\.rej|\.swp|~)$/i,
  /\.log$/i,
  /\.map$/i,
  /\.(zip|tar|tgz|gz|7z|wasm|bin)$/i,
  /private[-_]?key/i
];
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  /\bBearer\s+[A-Za-z0-9._~+/-]{24,}\b/i
];
const executablePatterns = [
  /node:(?:http|https|net|tls|dns|dgram|child_process)/,
  /\b(?:fetch|WebSocket|XMLHttpRequest|spawn|execFile|execSync|spawnSync)\s*\(/
];

function shannonEntropy(value) {
  const counts = new Map();
  for (const character of value) counts.set(character, (counts.get(character) ?? 0) + 1);
  return [...counts.values()].reduce((sum, count) => {
    const probability = count / value.length;
    return sum - probability * Math.log2(probability);
  }, 0);
}

function containsSuspiciousAssignedSecret(content) {
  const assignments = content.matchAll(
    /\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)\b\s*[:=]\s*["']([^"' \r\n]{24,})["']/giu
  );
  for (const [, candidate] of assignments) {
    if (new Set(candidate).size >= 12 && shannonEntropy(candidate) >= 3.5) return true;
  }
  return false;
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (directory === root && entry.isDirectory() && entry.name === ".git") continue;
    assert(!forbiddenNames.some((pattern) => pattern.test(entry.name)), `forbidden path: ${entry.name}`);
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

const files = await walk(root);
const localLinks = [];
assert(files.length >= 20, "release unexpectedly small");
const manifest = await readFile(resolve(root, "PUBLIC_RELEASE_MANIFEST.md"), "utf8");
const allowlistBlock = manifest.match(/## Allowlist[\s\S]*?```text\n([\s\S]*?)\n```/);
assert(allowlistBlock, "manifest allowlist missing");
const allowlist = allowlistBlock[1].split("\n").filter(Boolean).sort();
const actual = files.map((path) => relative(root, path)).sort();
assert.deepEqual(actual, allowlist, "release file set differs from explicit allowlist");
const checksumLines = (await readFile(resolve(root, "release/SHA256SUMS"), "utf8")).trim().split("\n");
assert.equal(checksumLines.length, files.length - 1, "checksum inventory mismatch");
for (const line of checksumLines) {
  const match = line.match(/^([0-9a-f]{64})  \.\/(.+)$/);
  assert(match, "invalid checksum line");
  assert.notEqual(match[2], "release/SHA256SUMS", "checksum file cannot cover itself");
  const content = await readFile(resolve(root, match[2]));
  assert.equal(createHash("sha256").update(content).digest("hex"), match[1], `checksum mismatch: ${match[2]}`);
}
for (const path of files) {
  const name = relative(root, path);
  const info = await lstat(path);
  assert.equal(info.isSymbolicLink(), false, `symlink: ${name}`);
  assert.equal(info.mode & 0o111, 0, `executable: ${name}`);
  assert(textExtensions.has(extname(path).toLowerCase()), `non-text artifact: ${name}`);
  const content = await readFile(path, "utf8");
  for (const pattern of secretPatterns) assert(!pattern.test(content), `secret-shaped content: ${name}`);
  assert(!containsSuspiciousAssignedSecret(content), `high-entropy credential assignment: ${name}`);
  if (name.endsWith(".svg")) {
    assert.match(content, /^<svg\b/u, `invalid SVG root: ${name}`);
    for (const pattern of [
      /<script\b/iu,
      /<foreignObject\b/iu,
      /\bon[a-z]+\s*=/iu,
      /\b(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/|data:|javascript:)/iu,
      /url\s*\(/iu
    ]) assert(!pattern.test(content), `active or external SVG content: ${name}`);
  }
  if (name.endsWith(".mjs")) {
    for (const pattern of executablePatterns) assert(!pattern.test(content), `egress/subprocess surface: ${name}`);
  }
  if (name.endsWith(".md")) {
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      const target = match[1].replace(/^<|>$/g, "").split("#", 1)[0];
      if (target && !/^(?:https?:|mailto:)/.test(target)) localLinks.push(resolve(dirname(path), target));
    }
  }
  if (name.endsWith(".json")) JSON.parse(content);
}
for (const path of localLinks) await lstat(path);

const readPublic = (path) => readFile(resolve(root, path), "utf8");
const packageDocument = JSON.parse(await readPublic("package.json"));
const readme = await readPublic("README.md");
const disclosureChecklist = await readPublic("PUBLIC_DISCLOSURE_CHECKLIST.md");
const versioning = await readPublic("VERSIONING.md");
const license = await readPublic("LICENSE");
const notice = await readPublic("NOTICE");
const workflow = await readPublic(".github/workflows/verify.yml");
const releaseWorkflow = await readPublic(".github/workflows/release.yml");
const packageWorkflow = await readPublic(".github/workflows/package.yml");
const codeqlWorkflow = await readPublic(".github/workflows/codeql.yml");
const dependencyReviewWorkflow = await readPublic(".github/workflows/dependency-review.yml");
const scorecardWorkflow = await readPublic(".github/workflows/scorecard.yml");
const actionMetadata = await readPublic("action.yml");
const actionContract = await readPublic("docs/ACTION.md");
const repositoryPreview = await readPublic("docs/assets/repository-preview.svg");
assert.equal(packageDocument.version, "0.10.0");
assert.equal(packageDocument.name, "verahelm-decision-envelope");
assert.equal(packageDocument.description,
  "Offline verifier and GitHub Action for Verahelm Decision Envelopes.");
assert.match(readme, /^# Verahelm Decision Envelope\n\nVerahelm verifies whether a signed authorization record is valid/u);
assert.match(readme, /git clone --depth 1 https:\/\/github\.com\/Verahelm\/verahelm-decision-envelope\.git && cd verahelm-decision-envelope && node cli\/verahelm\.mjs demo/);
assert.match(readme, /\{"status":"demo_complete","results":\[\{"fixture":"pass","status":"pass"\},\{"fixture":"blocked","status":"blocked"\},\{"fixture":"expired","status":"expired"\},\{"fixture":"tampered","status":"tampered"\}\]\}/);
assert.match(readme, /It does not prove the truth or quality of underlying evidence/);
assert.match(readme, /## Add the verifier to a pull request/);
assert.match(readme, /defines no\s+fields for repositories, source code, prompts, traces, files, datasets, or raw\s+records/);
assert.match(readme, /Verahelm\/verahelm-decision-envelope@[0-9a-f]{40}/);
assert.match(readme, /## Role in the toolchain/);
assert.match(readme, /## Published components/);
assert.match(readme, /verahelm-decision-envelope-demo\/pull\/1/);
assert.match(readme, /verahelm-decision-envelope-demo\/pull\/2/);
assert.doesNotMatch(readme, /## (?:Differentiation|Security proof|Start)\b/);
assert(actual.includes("docs/COMPARISON.md"), "neutral sourced comparison missing");
for (const stream of [
  "Hosted API contract", "Decision Envelope schema", "Verifier and integration kit",
  "GitHub Action", "Public result/code vocabulary"
]) assert.match(versioning, new RegExp(stream));
assert.match(license, /Apache License\s+Version 2\.0, January 2004/);
assert.match(notice, /private decision engine/);
assert.match(notice, /not part of this distribution and are not\s+licensed by it/);
assert.equal(packageDocument.license, "Apache-2.0");
assert.doesNotMatch(license, /\bMIT License\b/);
assert.match(workflow, /permissions:\s*\n\s*contents: read/);
assert.doesNotMatch(workflow, /pull-requests: write|contents: write|id-token: write/);
assert.match(releaseWorkflow, /actions\/checkout@[0-9a-f]{40}/);
assert.match(releaseWorkflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/);
assert.match(releaseWorkflow, /actions\/attest-build-provenance@[0-9a-f]{40}/);
assert.match(releaseWorkflow, /permissions:\s*\n\s*contents: write\s*\n\s*id-token: write\s*\n\s*attestations: write/);
assert.match(releaseWorkflow, /gh release create[\s\S]*--draft/);
assert.match(releaseWorkflow, /gh release edit[\s\S]*--draft=false/);
assert.doesNotMatch(releaseWorkflow, /uses:\s+(?!actions\/(?:checkout|attest-build-provenance)@)/);
assert.match(packageWorkflow, /actions\/checkout@[0-9a-f]{40}/);
assert.match(packageWorkflow, /actions\/setup-node@[0-9a-f]{40}/);
assert.match(packageWorkflow, /actions\/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1/);
assert.match(packageWorkflow, /actions\/setup-node@820762786026740c76f36085b0efc47a31fe5020/);
assert.match(packageWorkflow, /os: \[ubuntu-latest, macos-latest, windows-latest\]/);
assert.match(packageWorkflow, /node: \[20, 22, 24\]/);
assert.match(packageWorkflow, /npm install --ignore-scripts/);
assert.match(packageWorkflow, /permissions:\s*\n\s*contents: read/);
assert.match(codeqlWorkflow, /github\/codeql-action\/init@e58424170fb0262c8d7ed60a2e84b9bffe205c67/);
assert.match(codeqlWorkflow, /github\/codeql-action\/analyze@e58424170fb0262c8d7ed60a2e84b9bffe205c67/);
assert.match(codeqlWorkflow, /security-events: write/);
assert.match(codeqlWorkflow, /contents: read/);
assert.doesNotMatch(codeqlWorkflow, /contents: write|pull-requests: write|id-token: write/);
assert.match(dependencyReviewWorkflow,
  /actions\/dependency-review-action@a1d282b36b6f3519aa1f3fc636f609c47dddb294/);
assert.match(dependencyReviewWorkflow, /permissions:\s*\n\s*contents: read/);
assert.doesNotMatch(dependencyReviewWorkflow, /contents: write|pull-requests: write|id-token: write/);
assert.match(scorecardWorkflow,
  /ossf\/scorecard-action@2d1146689b8cda280b9bc96326124645441f03bc/);
assert.match(scorecardWorkflow,
  /github\/codeql-action\/upload-sarif@e58424170fb0262c8d7ed60a2e84b9bffe205c67/);
assert.match(scorecardWorkflow, /publish_results: false/);
assert.doesNotMatch(scorecardWorkflow, /contents: write|pull-requests: write|id-token: write/);
assert.deepEqual(packageDocument.bin, { "verahelm-envelope": "cli/verahelm.mjs" });
assert.deepEqual(packageDocument.dependencies ?? {}, {});
assert.deepEqual(packageDocument.devDependencies ?? {}, {});
for (const name of ["preinstall", "install", "postinstall", "prepare"]) {
  assert.equal(packageDocument.scripts[name], undefined);
}
assert.match(actionMetadata, /^name: Verahelm Decision Envelope verifier$/m);
assert.match(actionMetadata, /^author: Verahelm Holdings LLC$/m);
assert.match(actionMetadata, /branding:\s*\n\s*icon: check-square\s*\n\s*color: gray-dark/);
assert.match(actionMetadata, /outputs:\s*\n\s*status:[\s\S]*\n\s*valid:/);
assert.match(actionContract, /steps\.verahelm\.outputs\.valid == 'true'/);
for (const input of [
  "envelope", "public-key", "public-key-sha256", "status",
  "trust-bundle", "trust-bundle-sha256",
  "status-max-age-seconds", "subject-id", "subject-version", "authority-id",
  "scope-environment", "scope-change"
]) assert.match(actionContract, new RegExp(`\\| \\\`${input}\\\` \\|`));
const trustBundle = await readPublic("fixtures/trust-bundle.json");
assert.match(actionContract, /Use either the public-key pair or the trust-bundle pair, never both/);
assert.match(await readPublic("docs/CLI.md"),
  new RegExp(`sha256:${createHash("sha256").update(trustBundle).digest("hex")}`));
assert.match(actionContract, /performs offline verification\s+only/);
assert.match(actionContract, /does not call Verahelm's hosted service/);
assert.match(disclosureChecklist, /Synthetic or fictional data only/);
assert.match(disclosureChecklist, /Owner approval is recorded before publication/);
assert.match(manifest, /Publication remains an owner-controlled action/);
assert.match(repositoryPreview, /VERIFY THE/);
assert.match(repositoryPreview, /DECISION ENVELOPE/);
assert.doesNotMatch(repositoryPreview, /tesseract|4D PROJECTION|16 VERTICES/iu);

// In-memory negative controls ensure the disclosure checks fail closed without
// adding usable credentials or prohibited artifacts to the repository.
const generatedCredential = ["vK7_", "pQ9-", "xR2_", "mN8-", "cT4_", "zL6-"].join("");
assert(containsSuspiciousAssignedSecret(`api_key="${generatedCredential}"`));
assert(forbiddenNames.some((pattern) => pattern.test(".env.local")));
assert(forbiddenNames.some((pattern) => pattern.test("bundle.zip")));
assert(secretPatterns.some((pattern) => pattern.test(
  ["-----BEGIN ", "PRIVATE KEY-----"].join("")
)));

for (const name of ["pass", "blocked", "expired", "tampered"]) {
  const fixture = JSON.parse(await readFile(resolve(root, "fixtures", `${name}.json`), "utf8"));
  assert.match(fixture.payload.envelope_id, /^de_synthetic_/);
  assert.match(fixture.payload.authority.id, /^synthetic-/);
}

assert(!files.some((path) => relative(root, path).startsWith(".git/")), "Git history present");
process.stdout.write(`release_gate=pass files=${files.length} links=${localLinks.length} history=absent egress=absent subprocess=absent\n`);
