require('chai').should()
fs = require 'fs-extra'
_ = require 'underscore'
exec = require('child_process').exec
cli = require('../lib/cli')
sinon = require('sinon')

cmd = ['node', 'fixclosure', '--no-color']

class MockStdOut
  constructor: () ->
    @buffer = []
  write: (msg) ->
    @buffer.push msg
  toString: () ->
    @buffer.join ''

describe 'Command line', ->
  out = null
  err = null
  exit = null

  beforeEach ->
    out = new MockStdOut
    err = new MockStdOut
    exit = sinon.spy()

  it 'suceed with file argument', () ->
    cli(cmd.concat(['test/fixtures/cli/ok.js']), out, err, exit)
    exit.called.should.be.false

  it 'exit with 1 if no file argument', () ->
    stubWrite = sinon.stub(process.stdout, 'write');
    cli(cmd, out, err, exit)
    stubWrite.restore()

    exit.calledOnce.should.be.true
    exit.firstCall.args.should.eql [1]

  it 'exit with 1 if the result is NG', () ->
    cli(cmd.concat(['test/fixtures/cli/ng.js']), out, err, exit)
    exit.calledOnce.should.be.true
    exit.firstCall.args.should.eql [1]

  it 'output all error types', () ->
    cli(cmd.concat(['test/fixtures/cli/all-ng-types.js']), out, err, exit)
    exit.calledOnce.should.be.true
    exit.firstCall.args.should.eql [1]
    expected = fs.readFileSync('test/fixtures/cli/all-ng-types.js.error.txt', encoding: 'utf8')
    err.toString().should.be.eql expected

  describe 'suppressUnused', ->
    it 'success if a package required with "suppress unused" is not used', () ->
      cli(cmd.concat(['test/fixtures/cli/suppress_unused.js', '--showSuccess']), out, err, exit)
      exit.calledOnce.should.be.false

      expected = fs.readFileSync('test/fixtures/cli/suppress_unused.js.txt', encoding: 'utf8')
      out.toString().should.be.eql expected

  describe 'Options', ->
    it '--namespaceMethods', () ->
      cli(cmd.concat([
        'test/fixtures/cli/package_method.js',
        '--namespaceMethods=goog.foo.namespacemethod1,goog.foo.namespacemethod2'
      ]), out, err, exit)
      exit.called.should.be.false

    it '--roots', () ->
      cli(cmd.concat([
        'test/fixtures/cli/roots.js',
        '--roots=foo,bar'
      ]), out, err, exit)
      exit.called.should.be.false

    it '--replaceMap', () ->
      cli(cmd.concat([
        'test/fixtures/cli/replacemap.js',
        '--replaceMap=goog.foo.foo:goog.bar.bar,goog.baz.Baz:goog.baz.Baaz'
      ]), out, err, exit)
      exit.called.should.be.false

    it 'without --showSuccess', () ->
      cli(cmd.concat([
        'test/fixtures/cli/ok.js',
        'test/fixtures/cli/ng.js',
      ]), out, err, exit)
      exit.calledOnce.should.be.true
      exit.firstCall.args.should.eql [1]
      expectedErr = fs.readFileSync('test/fixtures/cli/ng.js.txt', encoding: 'utf8')
      out.toString().should.be.eql ''
      err.toString().should.be.eql expectedErr

    it '--showSuccess', () ->
      cli(cmd.concat([
        'test/fixtures/cli/ok.js',
        'test/fixtures/cli/ng.js',
        '--showSuccess'
      ]), out, err, exit)
      exit.calledOnce.should.be.true
      exit.firstCall.args.should.eql [1]
      expectedOk = fs.readFileSync('test/fixtures/cli/ok.js.txt', encoding: 'utf8')
      expectedErr = fs.readFileSync('test/fixtures/cli/ng.js.txt', encoding: 'utf8')
      out.toString().should.be.eql expectedOk
      err.toString().should.be.eql expectedErr

    describe '--fix-in-place', () ->
      testFixInPlace = (filename) ->
        tmppath = 'test/tmp/' + filename
        fs.copySync('test/fixtures/cli/' + filename, tmppath)
        cli(cmd.concat([tmppath, '--fix-in-place']), out, err, exit)
        exit.calledOnce.should.be.false
        fixedSrc = fs.readFileSync(tmppath, encoding: 'utf8')
        expected = fs.readFileSync('test/fixtures/cli/' + filename + '.fixed.txt', encoding: 'utf8')
        fixedSrc.should.be.eql expected

      it 'fix in place all error types', () ->
        testFixInPlace 'all-ng-types.js'

      it 'fix a file without provide', () ->
        testFixInPlace 'fix-no-provide.js'

      it 'fix a file with header comment and no provide', () ->
        testFixInPlace 'fix-comment-and-no-provide.js'

  describe '.fixclosurerc', ->
    cwd = null

    beforeEach ->
      cwd = process.cwd()

    afterEach ->
      process.chdir(cwd)

    it 'loaded in the current dir by default', () ->
      # change cwd to ./test to load ./test/.fixclosurerc
      process.chdir(__dirname + '/fixtures/findconfig')

      cli(cmd.concat([
        __dirname + '/fixtures/cli/config.js',
      ]), out, err, exit)
      exit.called.should.be.false

    it 'loaded by "--config" option', () ->
      cli(cmd.concat([
        'test/fixtures/cli/config.js',
        '--config=test/fixtures/cli/.fixclosurerc1'
      ]), out, err, exit)
      exit.called.should.be.false
