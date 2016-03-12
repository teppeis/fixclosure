require('chai').should()
fs = require 'fs'
require 'coffee-script'
asserts = require './lib/asserts'

describe 'Parser', ->
  context 'script', ->
    files = fs.readdirSync(__dirname + '/fixtures/parse/')
    files.forEach (file) ->
      it file, ->
        asserts.assertFile('/parse/' + file)

  context 'module', ->
    files = fs.readdirSync(__dirname + '/fixtures/parse-module/')
    files.forEach (file) ->
      it file, ->
        asserts.assertFile('/parse-module/' + file, {parserOptions: {sourceType: 'module'}})
