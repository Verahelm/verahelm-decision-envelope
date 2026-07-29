import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const packageDocument = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const cli = await readFile(new URL("cli/verahelm.mjs", root), "utf8");
const documentation = await readFile(new URL("docs/PACKAGE.md", root), "utf8");

assert.equal(packageDocument.private, true);
assert.equal(packageDocument.version, "0.10.0");
assert.equal(packageDocument.license, "Apache-2.0");
assert.deepEqual(packageDocument.bin, { "verahelm-envelope": "cli/verahelm.mjs" });
assert.deepEqual(packageDocument.dependencies ?? {}, {});
for (const name of ["preinstall", "install", "postinstall", "prepare"]) {
  assert.equal(packageDocument.scripts[name], undefined);
}
assert.match(cli, /^#!\/usr\/bin\/env node\n/);
assert.match(documentation, /npm exec --yes --ignore-scripts --package=https:\/\/github\.com\/Verahelm\/verahelm-decision-envelope\/releases\/download\/v0\.10\.0\/verahelm-decision-envelope-0\.10\.0\.tgz/);
assert.match(documentation, /Envelope verification itself remains\s+offline/);

process.stdout.write("package_contract=pass dependencies=none install_scripts=none\n");
