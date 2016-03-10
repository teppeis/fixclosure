var Parser = require('./lib/parser');
var cli = require('./lib/cli');
var fix = require('./lib/fix');

module.exports.Parser = Parser;
module.exports.fix = fix;
module.exports.cli = cli;

// TODO: suppress warning
// TODO: namespace re-assignment
// TODO: goog.scope
// TODO: detect missing goog.base
// TODO: detect missing dispose
