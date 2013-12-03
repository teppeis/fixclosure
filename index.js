var dir = './lib/';
if (process.env.COVERAGE) {
  dir = './lib-cov/';
}

var Parser = require(dir + 'parser');
var cli = require(dir + 'cli');
var fix = require(dir + 'fix');

module.exports.Parser = Parser;
module.exports.fix = fix;
module.exports.cli = cli;

// TODO: suppress warning
// TODO: namespace re-assignment
// TODO: goog.scope
// TODO: detect missing goog.base
// TODO: detect missing dispose
