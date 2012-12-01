require('chai').should()
fs = require 'fs'
exec = require('child_process').exec

opt = {cwd: __dirname}
fixclosure = '../bin/fixclosure.js'

describe 'Command line', ->
  it 'exec without args', (done) ->
    exec fixclosure, opt, (err, stdout, stderr) ->
      err.code.should.be.eql 1
      done()

  it 'exec with file', (done) ->
    exec fixclosure + ' fixtures/exec.js', opt, (err) ->
      done(err)
