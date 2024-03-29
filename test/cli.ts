/* eslint-disable @typescript-eslint/no-unused-expressions */

import { should } from "chai";
import fs from "node:fs";
import sinon from "sinon";
import { cli } from "../src/cli";

should();
const cmd = ["node", "fixclosure", "--no-color"];

class MockStdOut {
  buffer: string[];
  constructor() {
    this.buffer = [];
  }
  write(msg: string) {
    this.buffer.push(msg);
  }
  toString(): string {
    return this.buffer.join("");
  }
}

const providedNamespaces = [
  "goog",
  "goog.foo",
  "goog.bar",
  "goog.baz",
  "goog.require.dup",
  "goog.require.ignore",
  "goog.require.missing",
  "goog.require.unnecessary",
  "goog.requireType.dup",
  "goog.requireType.ignore",
  "goog.requireType.missing",
  "goog.requireType.unnecessary",
  "goog.forwardDeclare.dup",
  "goog.forwardDeclare.ignore",
  "goog.forwardDeclare.missing",
  "goog.forwardDeclare.unnecessary",
];
const ns = `--namespaces=${providedNamespaces.join(",")}`;

describe("Command line", () => {
  let out: MockStdOut;
  let err: MockStdOut;
  let exit: sinon.SinonSpy;

  beforeEach(() => {
    out = new MockStdOut();
    err = new MockStdOut();
    exit = sinon.spy();
  });

  it("succeed with file argument", async () => {
    await cli(cmd.concat(["test/fixtures/cli/ok.js", ns]), out, err, exit);
    exit.called.should.be.false;
  });

  it("exit with 1 if no file argument", async () => {
    const stubWrite = sinon.stub(process.stdout, "write");
    await cli(cmd, out, err, exit);
    stubWrite.restore();

    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
  });

  it("exit with 1 if the result is NG", async () => {
    await cli(cmd.concat(["test/fixtures/cli/ng.js", ns]), out, err, exit);
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
  });

  it("output all error types", async () => {
    await cli(
      cmd.concat(["test/fixtures/cli/all-ng-types.js", ns]),
      out,
      err,
      exit,
    );
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
    const expected = fs.readFileSync(
      "test/fixtures/cli/all-ng-types.js.error.txt",
      "utf8",
    );
    err.toString().should.be.eql(expected);
  });

  it("output all error types with --useForwardDeclare", async () => {
    await cli(
      cmd.concat([
        "test/fixtures/cli/all-ng-types.js",
        "--useForwardDeclare",
        ns,
      ]),
      out,
      err,
      exit,
    );
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
    const expected = fs.readFileSync(
      "test/fixtures/cli/all-ng-types.js.forwarddeclare.error.txt",
      "utf8",
    );
    err.toString().should.be.eql(expected);
  });

  it("duplicated provide", async () => {
    await cli(
      cmd.concat(["test/fixtures/cli/duplicated_provide.js"]),
      out,
      err,
      exit,
    );
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
    const expected = fs.readFileSync(
      "test/fixtures/cli/duplicated_provide.js.txt",
      "utf8",
    );
    err.toString().should.be.eql(expected);
  });

  describe("fixclosure: ignore", () => {
    it('ignores goog.require with "fixclosre: ignore" even if it is not used', async () => {
      await cli(
        cmd.concat(["test/fixtures/cli/ignore_require.js", "--showSuccess"]),
        out,
        err,
        exit,
      );
      exit.calledOnce.should.be.false;

      const expected = fs.readFileSync(
        "test/fixtures/cli/ignore_require.js.txt",
        "utf8",
      );
      out.toString().should.be.eql(expected);
    });

    it('ignores goog.provide with "fixclosre: ignore" even if it is not provided actually', async () => {
      await cli(
        cmd.concat(["test/fixtures/cli/ignore_provide.js", "--showSuccess"]),
        out,
        err,
        exit,
      );
      exit.calledOnce.should.be.false;

      const expected = fs.readFileSync(
        "test/fixtures/cli/ignore_provide.js.txt",
        "utf8",
      );
      out.toString().should.be.eql(expected);
    });
  });

  describe("Options", () => {
    it("--depsJs", async () => {
      await cli(
        cmd.concat([
          "test/fixtures/cli/depsjs.js",
          "--depsJs=test/fixtures/cli/deps.js",
          ns,
        ]),
        out,
        err,
        exit,
      );
      exit.called.should.be.false;
    });

    describe("--provideRoots", () => {
      it('includes "goog,proto2,soy,soydata,svgpan" by default', async () => {
        await cli(
          cmd.concat(["test/fixtures/cli/provideRootsDefault.js", ns]),
          out,
          err,
          exit,
        );
        sinon.assert.notCalled(exit);
      });

      it('does not include "foo,bar" by default', async () => {
        await cli(
          cmd.concat(["test/fixtures/cli/provideRoots.js", ns]),
          out,
          err,
          exit,
        );
        sinon.assert.called(exit);
      });

      it("includes specified roots", async () => {
        await cli(
          cmd.concat([
            "test/fixtures/cli/provideRoots.js",
            "--provideRoots=foo,bar",
          ]),
          out,
          err,
          exit,
        );
        sinon.assert.notCalled(exit);
      });

      it("does not include default roots if a value is specified", async () => {
        await cli(
          cmd.concat([
            "test/fixtures/cli/provideRootsDefault.js",
            "--provideRoots=foo,bar",
            ns,
          ]),
          out,
          err,
          exit,
        );
        sinon.assert.called(exit);
      });
    });

    describe("--ignoreProvides", () => {
      it("does not remove any provides", async () => {
        await cli(
          cmd.concat([
            "test/fixtures/cli/ignoreProvidesAdd.js",
            "--ignoreProvides",
          ]),
          out,
          err,
          exit,
        );
        exit.called.should.be.false;
      });

      it("does not add any provides", async () => {
        await cli(
          cmd.concat([
            "test/fixtures/cli/ignoreProvidesRemove.js",
            "--ignoreProvides",
            "--provideRoots=foo,bar",
          ]),
          out,
          err,
          exit,
        );
        exit.called.should.be.false;
      });
    });

    it("--replaceMap", async () => {
      await cli(
        cmd.concat([
          "test/fixtures/cli/replacemap.js",
          "--replaceMap=goog.foo1:goog.foo,goog.bar1:goog.bar",
          ns,
        ]),
        out,
        err,
        exit,
      );
      exit.called.should.be.false;
    });

    it("without --showSuccess", async () => {
      await cli(
        cmd.concat(["test/fixtures/cli/ok.js", "test/fixtures/cli/ng.js", ns]),
        out,
        err,
        exit,
      );
      exit.calledOnce.should.be.true;
      exit.firstCall.args.should.eql([1]);
      const expectedErr = fs.readFileSync(
        "test/fixtures/cli/ng.js.txt",
        "utf8",
      );
      out.toString().should.be.eql("");
      err.toString().should.be.eql(expectedErr);
    });

    it("--showSuccess", async () => {
      await cli(
        cmd.concat([
          "test/fixtures/cli/ok.js",
          "test/fixtures/cli/ng.js",
          "--showSuccess",
          ns,
        ]),
        out,
        err,
        exit,
      );
      exit.calledOnce.should.be.true;
      exit.firstCall.args.should.eql([1]);
      const expectedOk = fs.readFileSync("test/fixtures/cli/ok.js.txt", "utf8");
      const expectedErr = fs.readFileSync(
        "test/fixtures/cli/ng.js.txt",
        "utf8",
      );
      out.toString().should.be.eql(expectedOk);
      err.toString().should.be.eql(expectedErr);
    });

    describe("--fix-in-place", () => {
      it("fix in place all error types", () =>
        testFixInPlace("all-ng-types.js"));

      it("fix in place all error types with --useForwardDeclare", () =>
        testFixInPlace("all-ng-types.js.forwarddeclare", [
          "--useForwardDeclare",
        ]));

      it("fix a file without provide", () =>
        testFixInPlace("fix-no-provide.js"));

      it("fix a file with header comment and no provide", () =>
        testFixInPlace("fix-comment-and-no-provide.js"));
    });
  });

  const testFixInPlace = async (filename: string, options: string[] = []) => {
    const { temporaryFile } = await import("tempy");
    const tmppath = temporaryFile();
    fs.copyFileSync(`test/fixtures/cli/${filename}`, tmppath);
    await cli(
      cmd.concat([tmppath, "--fix-in-place", ns]).concat(options),
      out,
      err,
      exit,
    );
    exit.calledOnce.should.be.false;
    const fixedSrc = fs.readFileSync(tmppath, "utf8");
    const expected = fs.readFileSync(
      `test/fixtures/cli/${filename}.fixed.txt`,
      "utf8",
    );
    fixedSrc.should.be.eql(expected);
  };

  describe(".fixclosurerc", () => {
    let cwd: string;

    beforeEach(() => (cwd = process.cwd()));

    afterEach(() => process.chdir(cwd));

    it("loaded in the current dir by default", async () => {
      // change cwd to ./test to load ./test/.fixclosurerc
      process.chdir(`${__dirname}/fixtures/findconfig`);

      await cli(
        cmd.concat([`${__dirname}/fixtures/cli/config.js`]),
        out,
        err,
        exit,
      );
      exit.called.should.be.false;
    });

    it('loaded by "--config" option', async () => {
      await cli(
        cmd.concat([
          "test/fixtures/cli/config.js",
          "--config=test/fixtures/cli/.fixclosurerc1",
        ]),
        out,
        err,
        exit,
      );
      exit.called.should.be.false;
    });

    it("load --useForwardDecalre from config", () =>
      testFixInPlace("all-ng-types.js.forwarddeclare", [
        "--config=test/fixtures/cli/.fixclosurerc-forwarddeclare",
      ]));

    it("load --depsJs from config", async () => {
      await cli(
        cmd.concat([
          "test/fixtures/cli/depsjs.js",
          "--config=test/fixtures/cli/.fixclosurerc-depsjs",
          ns,
        ]),
        out,
        err,
        exit,
      );
      console.error(err.toString());
      exit.called.should.be.false;
    });
  });
});
