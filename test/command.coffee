require('chai').should()
fs = require 'fs'
exec = require('child_process').exec

opt = {cwd: __dirname}
finejs = '../bin/finejs'

describe 'Command line', ->
  it 'exec without args', (done) ->
    exec finejs, opt, (err, stdout, stderr) ->
      done(err)

  it 'exec with file', (done) ->
    exec finejs + ' fixtures/exec.js', opt, (err) ->
      done(err)
