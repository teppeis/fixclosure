require('chai').should()
fs = require 'fs'
require 'coffee-script'
asserts = require './lib/asserts'

describe 'Parser', ->
  files = fs.readdirSync(__dirname + '/fixtures/parse/')
  files.forEach (file) ->
    it file, ->
      asserts.assertFile('/parse/' + file)
