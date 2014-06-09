require('chai').should()
Parser = require('../../').Parser
fs = require 'fs'

exports.assertFile = (file) ->
  src = fs.readFileSync(__dirname + '/../fixtures' + file, 'utf8')

  regex = /^\/\/ provided: (.*)/gm
  provided = while ((matches = regex.exec src) != null)
    matches[1]

  regex = /^\/\/ required: (.*)/gm
  required = while (matches = regex.exec src) != null
    matches[1]

  regex = /^\/\/ toProvide: (.*)/gm
  toProvide = while (matches = regex.exec src) != null
    matches[1]

  regex = /^\/\/ toRequire: (.*)/gm
  toRequire = while (matches = regex.exec src) != null
    matches[1]

  regex = /^\/\/ suppressedProvide: (.*)/gm
  suppressedProvide = while (matches = regex.exec src) != null
    matches[1]

  regex = /^\/\/ suppressedRequire: (.*)/gm
  suppressedRequire = while (matches = regex.exec src) != null
    matches[1]

  parser = new Parser()
  info = parser.parse(src)
  #info.should.have.keys ['provided', 'required', 'toProvide', 'toRequire']
  info.provided.should.be.eql provided
  info.required.should.be.eql required
  info.toProvide.should.be.eql toProvide
  info.toRequire.should.be.eql toRequire
  info.suppressedProvide.should.be.eql suppressedProvide
  info.suppressedRequire.should.be.eql suppressedRequire
