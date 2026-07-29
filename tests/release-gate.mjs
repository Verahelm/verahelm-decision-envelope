import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir } from "node:fs/promises";
import { dirname, extname, relative, resolve } from "node:path";

const root = resolve(new URL("../", import.meta.url).pathname);
const textExtensions = new Set(["", ".cff", ".json", ".md", ".mjs", ".pem", ".svg", ".txt", ".yml", ".yaml"]);
const forbiddenNames = [
  /^\.git$/,
  /^\.env(?:\.|$)/,
  /^node_modules$/,
  /^dist$/,
  /^coverage$/,
  /^cache$/,
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
const versioning = await readPublic("VERSIONING.md");
const license = await readPublic("LICENSE");
const workflow = await readPublic(".github/workflows/verify.yml");
const releaseWorkflow = await readPublic(".github/workflows/release.yml");
const actionMetadata = await readPublic("action.yml");
const actionContract = await readPublic("docs/ACTION.md");
assert.equal(packageDocument.version, "0.6.0");
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
assert.match(license, /No license to Verahelm's private engine, methods,\s+thresholds, prompts, production service, data, or trademarks is granted/);
assert.doesNotMatch(license, /\bMIT License\b/);
assert.match(workflow, /permissions:\s*\n\s*contents: read/);
assert.doesNotMatch(workflow, /pull-requests: write|contents: write|id-token: write/);
assert.match(releaseWorkflow, /actions\/checkout@[0-9a-f]{40}/);
assert.match(releaseWorkflow, /actions\/attest-build-provenance@[0-9a-f]{40}/);
assert.match(releaseWorkflow, /permissions:\s*\n\s*contents: write\s*\n\s*id-token: write\s*\n\s*attestations: write/);
assert.match(releaseWorkflow, /gh release create[\s\S]*--draft/);
assert.match(releaseWorkflow, /gh release edit[\s\S]*--draft=false/);
assert.doesNotMatch(releaseWorkflow, /uses:\s+(?!actions\/(?:checkout|attest-build-provenance)@)/);
assert.match(actionMetadata, /^name: Verahelm Decision Envelope verifier$/m);
assert.match(actionMetadata, /^author: Verahelm Holdings LLC$/m);
assert.match(actionMetadata, /branding:\s*\n\s*icon: check-square\s*\n\s*color: gray-dark/);
assert.match(actionMetadata, /outputs:\s*\n\s*status:[\s\S]*\n\s*valid:/);
assert.match(actionContract, /steps\.verahelm\.outputs\.valid == 'true'/);
for (const input of [
  "envelope", "public-key", "public-key-sha256", "status",
  "status-max-age-seconds", "subject-id", "subject-version", "authority-id",
  "scope-environment", "scope-change"
]) assert.match(actionContract, new RegExp(`\\| \\\`${input}\\\` \\|`));
assert.match(actionContract, /performs offline verification\s+only/);
assert.match(actionContract, /does not call Verahelm's hosted service/);

for (const name of ["pass", "blocked", "expired", "tampered"]) {
  const fixture = JSON.parse(await readFile(resolve(root, "fixtures", `${name}.json`), "utf8"));
  assert.match(fixture.payload.envelope_id, /^de_synthetic_/);
  assert.match(fixture.payload.authority.id, /^synthetic-/);
}

assert(!files.some((path) => relative(root, path).startsWith(".git/")), "Git history present");
process.stdout.write(`release_gate=pass files=${files.length} links=${localLinks.length} history=absent egress=absent subprocess=absent\n`);
