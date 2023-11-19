import assert from "node:assert";
import { spawnSync } from "node:child_process";
import fs from "node:fs";

describe("bin/fixclosure", () => {
  it("should be able to execute fixclosure", () => {
    const result = spawnSync("node", [
      "bin/fixclosure.js",
      "--no-color",
      "test/fixtures/bin/ng.js",
    ]);
    const actual = result.stderr.toString();
    const expected = fs.readFileSync("test/fixtures/bin/ng.js.txt").toString();
    assert.strictEqual(actual, expected);
  });
});
