'use strict';

require('chai').should();
const fs = require('fs');
const cli = require('../lib/cli');
const sinon = require('sinon');
const tempy = require('tempy');

const cmd = ['node', 'fixclosure', '--no-color'];

class MockStdOut {
  constructor() {
    this.buffer = [];
  }
  write(msg) {
    this.buffer.push(msg);
  }
  toString() {
    return this.buffer.join('');
  }
}

describe('Command line', () => {
  let out = null;
  let err = null;
  let exit = null;

  beforeEach(() => {
    out = new MockStdOut();
    err = new MockStdOut();
    exit = sinon.spy();
  });

  it('suceed with file argument', async () => {
    await cli(cmd.concat(['test/fixtures/cli/ok.js']), out, err, exit);
    exit.called.should.be.false;
  });

  it('exit with 1 if no file argument', async () => {
    const stubWrite = sinon.stub(process.stdout, 'write');
    await cli(cmd, out, err, exit);
    stubWrite.restore();

    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
  });

  it('exit with 1 if the result is NG', async () => {
    await cli(cmd.concat(['test/fixtures/cli/ng.js']), out, err, exit);
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
  });

  it('output all error types', async () => {
    await cli(cmd.concat(['test/fixtures/cli/all-ng-types.js']), out, err, exit);
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
    const expected = fs.readFileSync('test/fixtures/cli/all-ng-types.js.error.txt', 'utf8');
    err.toString().should.be.eql(expected);
  });

  it('output all error types with --useForwardDeclare', async () => {
    await cli(
      cmd.concat(['test/fixtures/cli/all-ng-types.js', '--useForwardDeclare']),
      out,
      err,
      exit
    );
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
    const expected = fs.readFileSync(
      'test/fixtures/cli/all-ng-types.js.forwarddeclare.error.txt',
      'utf8'
    );
    err.toString().should.be.eql(expected);
  });

  it('duplicated provide', async () => {
    await cli(cmd.concat(['test/fixtures/cli/duplicated_provide.js']), out, err, exit);
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
    const expected = fs.readFileSync('test/fixtures/cli/duplicated_provide.js.txt', 'utf8');
    err.toString().should.be.eql(expected);
  });

  describe('fixclosure: ignore', () => {
    it('ignores goog.require with "fixclosre: ignore" even if it is not used', async () => {
      await cli(
        cmd.concat(['test/fixtures/cli/ignore_require.js', '--showSuccess']),
        out,
        err,
        exit
      );
      exit.calledOnce.should.be.false;

      const expected = fs.readFileSync('test/fixtures/cli/ignore_require.js.txt', 'utf8');
      out.toString().should.be.eql(expected);
    });

    it('ignores goog.provide with "fixclosre: ignore" even if it is not provided actually', async () => {
      await cli(
        cmd.concat(['test/fixtures/cli/ignore_provide.js', '--showSuccess']),
        out,
        err,
        exit
      );
      exit.calledOnce.should.be.false;

      const expected = fs.readFileSync('test/fixtures/cli/ignore_provide.js.txt', 'utf8');
      out.toString().should.be.eql(expected);
    });
  });

  describe('Options', () => {
    it('--namespaceMethods', async () => {
      await cli(
        cmd.concat([
          'test/fixtures/cli/package_method.js',
          '--namespaceMethods=goog.foo.namespacemethod1,goog.foo.namespacemethod2',
        ]),
        out,
        err,
        exit
      );
      exit.called.should.be.false;
    });

    it('--depsJs', async () => {
      await cli(
        cmd.concat(['test/fixtures/cli/depsjs.js', '--depsJs=test/fixtures/cli/deps.js']),
        out,
        err,
        exit
      );
      exit.called.should.be.false;
    });

    describe('--provideRoots', () => {
      it('includes "goog,proto2,soy,soydata,svgpan" by default', async () => {
        await cli(cmd.concat(['test/fixtures/cli/provideRootsDefault.js']), out, err, exit);
        sinon.assert.notCalled(exit);
      });

      it('does not include "foo,bar" by default', async () => {
        await cli(cmd.concat(['test/fixtures/cli/provideRoots.js']), out, err, exit);
        sinon.assert.called(exit);
      });

      it('includes specified roots', async () => {
        await cli(
          cmd.concat(['test/fixtures/cli/provideRoots.js', '--provideRoots=foo,bar']),
          out,
          err,
          exit
        );
        sinon.assert.notCalled(exit);
      });

      it('does not include default roots if a value is specified', async () => {
        await cli(
          cmd.concat(['test/fixtures/cli/provideRootsDefault.js', '--provideRoots=foo,bar']),
          out,
          err,
          exit
        );
        sinon.assert.called(exit);
      });
    });

    describe('--requireRoots', () => {
      it('includes "goog,proto2,soy,soydata,svgpan" by default', async () => {
        await cli(cmd.concat(['test/fixtures/cli/requireRootsDefault.js']), out, err, exit);
        sinon.assert.notCalled(exit);
      });

      it('does not include "foo,bar"', async () => {
        await cli(
          cmd.concat(['test/fixtures/cli/requireRoots.js', '--requireRoots=foo,bar']),
          out,
          err,
          exit
        );
        sinon.assert.notCalled(exit);
      });

      it('includes specified roots', async () => {
        await cli(
          cmd.concat(['test/fixtures/cli/requireRoots.js', '--requireRoots=foo,bar']),
          out,
          err,
          exit
        );
        sinon.assert.notCalled(exit);
      });

      it('does not include default roots if specified', async () => {
        await cli(
          cmd.concat(['test/fixtures/cli/requireRootsDefault.js', '--requireRoots=foo,bar']),
          out,
          err,
          exit
        );
        sinon.assert.called(exit);
      });
    });

    it('--replaceMap', async () => {
      await cli(
        cmd.concat([
          'test/fixtures/cli/replacemap.js',
          '--replaceMap=goog.foo.foo:goog.bar.bar,goog.baz.Baz:goog.baz.Baaz',
        ]),
        out,
        err,
        exit
      );
      exit.called.should.be.false;
    });

    it('without --showSuccess', async () => {
      await cli(cmd.concat(['test/fixtures/cli/ok.js', 'test/fixtures/cli/ng.js']), out, err, exit);
      exit.calledOnce.should.be.true;
      exit.firstCall.args.should.eql([1]);
      const expectedErr = fs.readFileSync('test/fixtures/cli/ng.js.txt', 'utf8');
      out.toString().should.be.eql('');
      err.toString().should.be.eql(expectedErr);
    });

    it('--showSuccess', async () => {
      await cli(
        cmd.concat(['test/fixtures/cli/ok.js', 'test/fixtures/cli/ng.js', '--showSuccess']),
        out,
        err,
        exit
      );
      exit.calledOnce.should.be.true;
      exit.firstCall.args.should.eql([1]);
      const expectedOk = fs.readFileSync('test/fixtures/cli/ok.js.txt', 'utf8');
      const expectedErr = fs.readFileSync('test/fixtures/cli/ng.js.txt', 'utf8');
      out.toString().should.be.eql(expectedOk);
      err.toString().should.be.eql(expectedErr);
    });

    describe('--fix-in-place', () => {
      const testFixInPlace = async (filename, options = []) => {
        const tmppath = tempy.file(`test/tmp/${filename}`);
        fs.copyFileSync(`test/fixtures/cli/${filename}`, tmppath);
        await cli(cmd.concat([tmppath, '--fix-in-place']).concat(options), out, err, exit);
        exit.calledOnce.should.be.false;
        const fixedSrc = fs.readFileSync(tmppath, 'utf8');
        const expected = fs.readFileSync(`test/fixtures/cli/${filename}.fixed.txt`, 'utf8');
        fixedSrc.should.be.eql(expected);
      };

      it('fix in place all error types', () => testFixInPlace('all-ng-types.js'));

      it('fix in place all error types with --useForwardDeclare', () =>
        testFixInPlace('all-ng-types.js.forwarddeclare', ['--useForwardDeclare']));

      it('fix a file without provide', () => testFixInPlace('fix-no-provide.js'));

      it('fix a file with header comment and no provide', () =>
        testFixInPlace('fix-comment-and-no-provide.js'));
    });
  });

  describe('.fixclosurerc', () => {
    let cwd = null;

    beforeEach(() => (cwd = process.cwd()));

    afterEach(() => process.chdir(cwd));

    it('loaded in the current dir by default', async () => {
      // change cwd to ./test to load ./test/.fixclosurerc
      process.chdir(`${__dirname}/fixtures/findconfig`);

      await cli(cmd.concat([`${__dirname}/fixtures/cli/config.js`]), out, err, exit);
      exit.called.should.be.false;
    });

    it('loaded by "--config" option', async () => {
      await cli(
        cmd.concat(['test/fixtures/cli/config.js', '--config=test/fixtures/cli/.fixclosurerc1']),
        out,
        err,
        exit
      );
      exit.called.should.be.false;
    });
  });
});
