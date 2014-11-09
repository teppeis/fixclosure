require('chai').should()
fs = require 'fs'
require 'coffee-script'
asserts = require './lib/asserts'

describe 'Parser', ->
  files = fs.readdirSync(__dirname + '/fixtures/parse/')
  files.forEach (file) ->
    it file, ->
      asserts.assertFile('/parse/' + file)

describe 'privateMethods of Parser', ->
  Parser = require '../lib/parser'
  parser = null

  beforeEach ->
    parser = new Parser

  describe 'isNamespaceConst_()', ->
    it 'returns true for CONSTANT in namespace', ->
      result = parser.isNamespaceConst_ 'CONSTANT'
      result.should.be.true

      result = parser.isNamespaceConst_ 'foo.CONSTANT'
      result.should.be.true

      result = parser.isNamespaceConst_ 'foo.bar.CONSTANT'
      result.should.be.true

    it 'returns false for method and Class in namespace', ->
      result = parser.isNamespaceConst_ 'Class'
      result.should.be.false

      result = parser.isNamespaceConst_ 'method'
      result.should.be.false

      result = parser.isNamespaceConst_ 'foo.Class'
      result.should.be.false

      result = parser.isNamespaceConst_ 'foo.method'
      result.should.be.false

      result = parser.isNamespaceConst_ 'foo.bar.Class'
      result.should.be.false

      result = parser.isNamespaceConst_ 'foo.bar.method'
      result.should.be.false

  describe 'removeDuplicated_()', () ->
    it 'remove duplicated classes', () ->
      computed = parser.removeDuplicated_ ['foo.Bar', 'foo.Bar.Baz', 'foo.Bar.CONSTANT']
      computed.should.be.eql ['foo.Bar']

  describe 'upperLevelOf_()', () ->
    it 'returns namespace of Class', () ->
      result = parser.upperLevelOf_ 'goog.ui.Component'
      result.should.be.equal 'goog.ui'

  describe 'isUpperCamelCase_()', () ->
    it 'returns true for UpperCamelCase', () ->
      result = parser.isUpperCamelCase_ 'UpperCamelCase'
      result.should.be.true

    it 'returns false for lowerCamelCase', () ->
      result = parser.isUpperCamelCase_ 'lowerCamelCase'
      result.should.be.false

    it 'returns false for snake_case', () ->
      result = parser.isUpperCamelCase_ 'snake_case'
      result.should.be.false

    it 'returns false for dash-separated-value', () ->
      result = parser.isUpperCamelCase_ 'dash-separated-value'
      result.should.be.false

    it 'returns false for CONSTANT', () ->
      result = parser.isUpperCamelCase_ 'CONSTANT'
      result.should.be.false

  describe 'isNamespace_()', () ->
    it 'returns true for namespaces', () ->
      result = parser.isNamespace_ 'goog'
      result.should.be.true

      result = parser.isNamespace_ 'goog.events'
      result.should.be.true

      result = parser.isNamespace_ 'goog.dom.classlist'
      result.should.be.true

    it 'returns false for classes', () ->
      result = parser.isNamespace_ 'Class'
      result.should.be.false

      result = parser.isNamespace_ 'goog.History'
      result.should.be.false

      result = parser.isNamespace_ 'goog.ui.Component'
      result.should.be.false

    it 'returns false for CONSTANT', () ->
      result = parser.isNamespace_ 'CONSTANT'
      result.should.be.false

      result = parser.isNamespace_ 'foo.BAR'
      result.should.be.false

      result = parser.isNamespace_ 'foo.bar.BAZ'
      result.should.be.false
