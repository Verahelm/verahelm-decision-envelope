import assert from "node:assert/strict";
import { parseJsonStrict } from "../verifier/json.mjs";
import { canonical } from "../verifier/verify.mjs";

let state = 0x56e2a19b;
function next() {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return state >>> 0;
}

function value(depth = 0) {
  const choice = next() % (depth >= 3 ? 4 : 6);
  if (choice === 0) return null;
  if (choice === 1) return (next() & 1) === 1;
  if (choice === 2) return (next() % 2000001) - 1000000;
  if (choice === 3) return `synthetic-${next().toString(16)}`;
  if (choice === 4) {
    return Array.from({ length: next() % 6 }, () => value(depth + 1));
  }
  const output = {};
  for (let index = 0; index < next() % 6; index++) {
    output[`k${index}_${next().toString(16)}`] = value(depth + 1);
  }
  return output;
}

function reordered(input) {
  if (Array.isArray(input)) return input.map(reordered);
  if (!input || typeof input !== "object") return input;
  return Object.fromEntries(
    Object.entries(input).reverse().map(([key, item]) => [key, reordered(item)])
  );
}

for (let index = 0; index < 500; index++) {
  const original = value();
  const encoded = canonical(original);
  assert.deepEqual(parseJsonStrict(encoded), original);
  assert.equal(canonical(parseJsonStrict(encoded)), encoded);
  assert.equal(canonical(reordered(original)), encoded);
}

for (const malformed of [
  "{\"a\":1,\"a\":2}",
  "{\"a\":1} trailing",
  "{\"a\":}",
  "[1,]",
  "\"\\x20\""
]) assert.throws(() => parseJsonStrict(malformed));

process.stdout.write("properties=pass cases=500 malformed=5 seed=56e2a19b\n");
