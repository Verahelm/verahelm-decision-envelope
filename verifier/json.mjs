// SPDX-License-Identifier: Apache-2.0
import { TextDecoder } from "node:util";

const decoder = new TextDecoder("utf-8", { fatal: true });

function whitespace(character) {
  return character === " " || character === "\t" || character === "\n" || character === "\r";
}

function skipWhitespace(source, start) {
  let index = start;
  while (index < source.length && whitespace(source[index])) index++;
  return index;
}

function scanString(source, start) {
  if (source[start] !== '"') throw new Error("json_string");
  let index = start + 1;
  while (index < source.length) {
    const character = source[index];
    if (character === '"') {
      const end = index + 1;
      return { end, value: JSON.parse(source.slice(start, end)) };
    }
    if (character.charCodeAt(0) <= 0x1f) throw new Error("json_control");
    if (character === "\\") {
      index++;
      if (index >= source.length) throw new Error("json_escape");
      if (source[index] === "u") {
        if (!/^[0-9a-fA-F]{4}$/u.test(source.slice(index + 1, index + 5))) {
          throw new Error("json_escape");
        }
        index += 4;
      } else if (!/^["\\/bfnrt]$/u.test(source[index])) {
        throw new Error("json_escape");
      }
    }
    index++;
  }
  throw new Error("json_string");
}

function scanValue(source, start) {
  let index = skipWhitespace(source, start);
  if (source[index] === "{") {
    const keys = new Set();
    index = skipWhitespace(source, index + 1);
    if (source[index] === "}") return index + 1;
    while (index < source.length) {
      const key = scanString(source, index);
      if (keys.has(key.value)) throw new Error("json_duplicate_key");
      keys.add(key.value);
      index = skipWhitespace(source, key.end);
      if (source[index] !== ":") throw new Error("json_object");
      index = skipWhitespace(source, scanValue(source, index + 1));
      if (source[index] === "}") return index + 1;
      if (source[index] !== ",") throw new Error("json_object");
      index = skipWhitespace(source, index + 1);
    }
    throw new Error("json_object");
  }
  if (source[index] === "[") {
    index = skipWhitespace(source, index + 1);
    if (source[index] === "]") return index + 1;
    while (index < source.length) {
      index = skipWhitespace(source, scanValue(source, index));
      if (source[index] === "]") return index + 1;
      if (source[index] !== ",") throw new Error("json_array");
      index = skipWhitespace(source, index + 1);
    }
    throw new Error("json_array");
  }
  if (source[index] === '"') return scanString(source, index).end;
  const valueStart = index;
  while (index < source.length && !whitespace(source[index]) && !/[,}\]]/u.test(source[index])) index++;
  if (index === valueStart) throw new Error("json_value");
  return index;
}

export function parseJsonStrict(source) {
  if (typeof source !== "string" || source.length === 0) throw new Error("json_input");
  const end = skipWhitespace(source, scanValue(source, 0));
  if (end !== source.length) throw new Error("json_trailing");
  return JSON.parse(source);
}

export function decodeUtf8(bytes) {
  return decoder.decode(bytes);
}

export function parseJsonBytes(bytes) {
  return parseJsonStrict(decodeUtf8(bytes));
}
