require('chai').should()
fs = require 'fs'
_ = require 'underscore'
exec = require('child_process').exec

opt = {cwd: __dirname}
fixclosure = '../bin/fixclosure.js --no-color'

describe 'Command line', ->
  it 'suceed with file argument', (done) ->
    exec fixclosure + ' fixtures/cli/ok.js', opt, (err) ->
      done(err)

  it 'exit with 1 if no file argument', (done) ->
    exec fixclosure, opt, (err, stdout, stderr) ->
      err.code.should.be.eql 1
      done()

  it 'exit with 1 if the result is NG', (done) ->
    exec fixclosure + ' fixtures/cli/ng.js', opt, (err) ->
      err.code.should.be.eql 1
      done()

  describe 'Options', ->
    it '--packageMethods', (done) ->
      cmd = [
        fixclosure,
        'fixtures/cli/package_method.js',
        '--packageMethods=goog.foo.packagemethod1,goog.foo.packagemethod2'
      ].join(' ')
      exec cmd, opt, (err) ->
        done(err)

    it '--roots', (done) ->
      cmd = [
        fixclosure,
        'fixtures/cli/roots.js',
        '--roots=foo,bar'
      ].join(' ')
      exec cmd, opt, (err) ->
        done(err)

    it '--replaceMap', (done) ->
      cmd = [
        fixclosure,
        'fixtures/cli/replacemap.js',
        '--replaceMap=goog.foo.foo:goog.bar.bar,goog.baz.Baz:goog.baz.Baaz'
      ].join(' ')
      exec cmd, opt, (err) ->
        done(err)
