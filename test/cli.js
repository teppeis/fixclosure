'use strict';

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('chai').should();
const fs = require('fs');
const cli = require('../lib/cli');
const sinon = require('sinon');

const cmd = ['node', 'fixclosure', '--no-color'];

class MockStdOut {
  constructor() {
    this.buffer = [];
  }
  write(msg) {
    return this.buffer.push(msg);
  }
  toString() {
    return this.buffer.join('');
  }
}

describe('Command line', function() {
  let out = null;
  let err = null;
  let exit = null;

  beforeEach(function() {
    out = new MockStdOut();
    err = new MockStdOut();
    return (exit = sinon.spy());
  });

  it('suceed with file argument', function() {
    cli(cmd.concat(['test/fixtures/cli/ok.js']), out, err, exit);
    return exit.called.should.be.false;
  });

  it('exit with 1 if no file argument', function() {
    const stubWrite = sinon.stub(process.stdout, 'write');
    cli(cmd, out, err, exit);
    stubWrite.restore();

    exit.calledOnce.should.be.true;
    return exit.firstCall.args.should.eql([1]);
  });

  it('exit with 1 if the result is NG', function() {
    cli(cmd.concat(['test/fixtures/cli/ng.js']), out, err, exit);
    exit.calledOnce.should.be.true;
    return exit.firstCall.args.should.eql([1]);
  });

  it('output all error types', function() {
    cli(cmd.concat(['test/fixtures/cli/all-ng-types.js']), out, err, exit);
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
    const expected = fs.readFileSync('test/fixtures/cli/all-ng-types.js.error.txt', {
      encoding: 'utf8',
    });
    return err.toString().should.be.eql(expected);
  });

  it('duplicated provide', function() {
    cli(cmd.concat(['test/fixtures/cli/duplicated_provide.js']), out, err, exit);
    exit.calledOnce.should.be.true;
    exit.firstCall.args.should.eql([1]);
    const expected = fs.readFileSync('test/fixtures/cli/duplicated_provide.js.txt', {
      encoding: 'utf8',
    });
    return err.toString().should.be.eql(expected);
  });

  describe('fixclosure: ignore', function() {
    it('ignores goog.require with "fixclosre: ignore" even if it is not used', function() {
      cli(cmd.concat(['test/fixtures/cli/ignore_require.js', '--showSuccess']), out, err, exit);
      exit.calledOnce.should.be.false;

      const expected = fs.readFileSync('test/fixtures/cli/ignore_require.js.txt', {
        encoding: 'utf8',
      });
      return out.toString().should.be.eql(expected);
    });

    return it('ignores goog.provide with "fixclosre: ignore" even if it is not provided actually', function() {
      cli(cmd.concat(['test/fixtures/cli/ignore_provide.js', '--showSuccess']), out, err, exit);
      exit.calledOnce.should.be.false;

      const expected = fs.readFileSync('test/fixtures/cli/ignore_provide.js.txt', {
        encoding: 'utf8',
      });
      return out.toString().should.be.eql(expected);
    });
  });

  describe('Options', function() {
    it('--namespaceMethods', function() {
      cli(
        cmd.concat([
          'test/fixtures/cli/package_method.js',
          '--namespaceMethods=goog.foo.namespacemethod1,goog.foo.namespacemethod2',
        ]),
        out,
        err,
        exit
      );
      return exit.called.should.be.false;
    });

    describe('--provideRoots', function() {
      it('includes "goog,proto2,soy,soydata,svgpan" by default', function() {
        cli(cmd.concat(['test/fixtures/cli/provideRootsDefault.js']), out, err, exit);
        return sinon.assert.notCalled(exit);
      });

      it('does not include "foo,bar" by default', function() {
        cli(cmd.concat(['test/fixtures/cli/provideRoots.js']), out, err, exit);
        return sinon.assert.called(exit);
      });

      it('includes specified roots', function() {
        cli(
          cmd.concat(['test/fixtures/cli/provideRoots.js', '--provideRoots=foo,bar']),
          out,
          err,
          exit
        );
        return sinon.assert.notCalled(exit);
      });

      return it('does not include default roots if a value is specified', function() {
        cli(
          cmd.concat(['test/fixtures/cli/provideRootsDefault.js', '--provideRoots=foo,bar']),
          out,
          err,
          exit
        );
        return sinon.assert.called(exit);
      });
    });

    describe('--requireRoots', function() {
      it('includes "goog,proto2,soy,soydata,svgpan" by default', function() {
        cli(cmd.concat(['test/fixtures/cli/requireRootsDefault.js']), out, err, exit);
        return sinon.assert.notCalled(exit);
      });

      it('does not include "foo,bar"', function() {
        cli(
          cmd.concat(['test/fixtures/cli/requireRoots.js', '--requireRoots=foo,bar']),
          out,
          err,
          exit
        );
        return sinon.assert.notCalled(exit);
      });

      it('includes specified roots', function() {
        cli(
          cmd.concat(['test/fixtures/cli/requireRoots.js', '--requireRoots=foo,bar']),
          out,
          err,
          exit
        );
        return sinon.assert.notCalled(exit);
      });

      return it('does not include default roots if specified', function() {
        cli(
          cmd.concat(['test/fixtures/cli/requireRootsDefault.js', '--requireRoots=foo,bar']),
          out,
          err,
          exit
        );
        return sinon.assert.called(exit);
      });
    });

    it('--roots (deprecated)', function() {
      cli(cmd.concat(['test/fixtures/cli/roots.js', '--roots=foo,bar']), out, err, exit);
      return exit.called.should.be.false;
    });

    it('--replaceMap', function() {
      cli(
        cmd.concat([
          'test/fixtures/cli/replacemap.js',
          '--replaceMap=goog.foo.foo:goog.bar.bar,goog.baz.Baz:goog.baz.Baaz',
        ]),
        out,
        err,
        exit
      );
      return exit.called.should.be.false;
    });

    it('without --showSuccess', function() {
      cli(cmd.concat(['test/fixtures/cli/ok.js', 'test/fixtures/cli/ng.js']), out, err, exit);
      exit.calledOnce.should.be.true;
      exit.firstCall.args.should.eql([1]);
      const expectedErr = fs.readFileSync('test/fixtures/cli/ng.js.txt', {encoding: 'utf8'});
      out.toString().should.be.eql('');
      return err.toString().should.be.eql(expectedErr);
    });

    it('--showSuccess', function() {
      cli(
        cmd.concat(['test/fixtures/cli/ok.js', 'test/fixtures/cli/ng.js', '--showSuccess']),
        out,
        err,
        exit
      );
      exit.calledOnce.should.be.true;
      exit.firstCall.args.should.eql([1]);
      const expectedOk = fs.readFileSync('test/fixtures/cli/ok.js.txt', {encoding: 'utf8'});
      const expectedErr = fs.readFileSync('test/fixtures/cli/ng.js.txt', {encoding: 'utf8'});
      out.toString().should.be.eql(expectedOk);
      return err.toString().should.be.eql(expectedErr);
    });

    return describe('--fix-in-place', function() {
      const testFixInPlace = function(filename) {
        const tmppath = `test/tmp/${filename}`;
        fs.copyFileSync(`test/fixtures/cli/${filename}`, tmppath);
        cli(cmd.concat([tmppath, '--fix-in-place']), out, err, exit);
        exit.calledOnce.should.be.false;
        const fixedSrc = fs.readFileSync(tmppath, {encoding: 'utf8'});
        const expected = fs.readFileSync(`test/fixtures/cli/${filename}.fixed.txt`, {
          encoding: 'utf8',
        });
        return fixedSrc.should.be.eql(expected);
      };

      it('fix in place all error types', () => testFixInPlace('all-ng-types.js'));

      it('fix a file without provide', () => testFixInPlace('fix-no-provide.js'));

      return it('fix a file with header comment and no provide', () =>
        testFixInPlace('fix-comment-and-no-provide.js'));
    });
  });

  return describe('.fixclosurerc', function() {
    let cwd = null;

    beforeEach(() => (cwd = process.cwd()));

    afterEach(() => process.chdir(cwd));

    it('loaded in the current dir by default', function() {
      // change cwd to ./test to load ./test/.fixclosurerc
      process.chdir(`${__dirname}/fixtures/findconfig`);

      cli(cmd.concat([`${__dirname}/fixtures/cli/config.js`]), out, err, exit);
      return exit.called.should.be.false;
    });

    return it('loaded by "--config" option', function() {
      cli(
        cmd.concat(['test/fixtures/cli/config.js', '--config=test/fixtures/cli/.fixclosurerc1']),
        out,
        err,
        exit
      );
      return exit.called.should.be.false;
    });
  });
});
