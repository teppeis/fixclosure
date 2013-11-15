require('chai').should()
fs = require 'fs'
exec = require('child_process').exec

opt = {cwd: __dirname}
fixclosure = '../bin/fixclosure.js'

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
