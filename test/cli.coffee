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
    expected = fs.readFileSync('test/fixtures/cli/all-ng-types.error.txt', encoding: 'utf8')
    err.toString().should.be.eql expected

  it 'fix in place all error types', () ->
    fs.copySync('test/fixtures/cli/all-ng-types.js', 'test/tmp/all-ng-types.js')
    cli(cmd.concat(['test/tmp/all-ng-types.js', '--fix-in-place']), out, err, exit)
    exit.calledOnce.should.be.false

    fixedSrc = fs.readFileSync('test/tmp/all-ng-types.js', encoding: 'utf8')
    expected = fs.readFileSync('test/fixtures/cli/all-ng-types.fixed.txt', encoding: 'utf8')
    fixedSrc.should.be.eql expected

  describe 'Options', ->
    it '--packageMethods', () ->
      cli(cmd.concat([
        'test/fixtures/cli/package_method.js',
        '--packageMethods=goog.foo.packagemethod1,goog.foo.packagemethod2'
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
      out.toString().should.be.eql ''
      err.toString().should.be.eql '''
        File: test/fixtures/cli/ng.js

        Provided:
        - goog.bar
        
        Required:
        - (none)
        
        Missing Require:
        - goog.baz
        
        FAIL!

        1 of 2 files failed

        '''

    it '--showSuccess', () ->
      cli(cmd.concat([
        'test/fixtures/cli/ok.js',
        'test/fixtures/cli/ng.js',
        '--showSuccess'
      ]), out, err, exit)
      exit.calledOnce.should.be.true
      exit.firstCall.args.should.eql [1]
      out.toString().should.be.eql '''
        File: test/fixtures/cli/ok.js

        Provided:
        - goog.bar

        Required:
        - goog.baz

        GREEN!

      '''
      err.toString().should.be.eql '''
        File: test/fixtures/cli/ng.js

        Provided:
        - goog.bar

        Required:
        - (none)

        Missing Require:
        - goog.baz

        FAIL!

        1 of 2 files failed

        '''

  describe '.fixclosurerc', ->
    it 'loaded in the current dir by default', () ->
      # change cwd to ./test to load ./test/.fixclosurerc
      cwd = process.cwd()
      process.chdir(__dirname)

      cli(cmd.concat([
        __dirname + '/fixtures/cli/config.js',
      ]), out, err, exit)
      exit.called.should.be.false

      # restore cwd
      process.chdir(cwd)

    it 'loaded by "--config" option', () ->
      cli(cmd.concat([
        'test/fixtures/cli/config.js',
        '--config=test/fixtures/cli/.fixclosurerc1'
      ]), out, err, exit)
      exit.called.should.be.false
