'use strict';

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
require('chai').should();
const {Parser} = require('../../');
const fs = require('fs');

exports.assertFile = function(file, options) {
  let matches;
  const src = fs.readFileSync(`${__dirname}/../fixtures${file}`, 'utf8');

  let regex = /^\/\/ provided: (.*)/gm;
  const provided = (() => {
    const result = [];
    while ((matches = regex.exec(src)) !== null) {
      result.push(matches[1]);
    }
    return result;
  })();

  regex = /^\/\/ required: (.*)/gm;
  const required = (() => {
    const result1 = [];
    while ((matches = regex.exec(src)) !== null) {
      result1.push(matches[1]);
    }
    return result1;
  })();

  regex = /^\/\/ toProvide: (.*)/gm;
  const toProvide = (() => {
    const result2 = [];
    while ((matches = regex.exec(src)) !== null) {
      result2.push(matches[1]);
    }
    return result2;
  })();

  regex = /^\/\/ toRequire: (.*)/gm;
  const toRequire = (() => {
    const result3 = [];
    while ((matches = regex.exec(src)) !== null) {
      result3.push(matches[1]);
    }
    return result3;
  })();

  regex = /^\/\/ ignoredProvide: (.*)/gm;
  const ignoredProvide = (() => {
    const result4 = [];
    while ((matches = regex.exec(src)) !== null) {
      result4.push(matches[1]);
    }
    return result4;
  })();

  regex = /^\/\/ ignoredRequire: (.*)/gm;
  const ignoredRequire = (() => {
    const result5 = [];
    while ((matches = regex.exec(src)) !== null) {
      result5.push(matches[1]);
    }
    return result5;
  })();

  const parser = new Parser(options);
  const info = parser.parse(src);
  // info.should.have.keys ['provided', 'required', 'toProvide', 'toRequire']
  info.provided.should.be.eql(provided);
  info.required.should.be.eql(required);
  info.toProvide.should.be.eql(toProvide);
  info.toRequire.should.be.eql(toRequire);
  info.ignoredProvide.should.be.eql(ignoredProvide);
  return info.ignoredRequire.should.be.eql(ignoredRequire);
};
