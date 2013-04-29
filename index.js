var dir = './lib/';
if (process.env.COVERAGE) {
  dir = './lib-cov/';
}

var fs = require('fs');
var Syntax = require(dir + 'syntax.js');
var Parser = require(dir + 'parser.js');

module.exports.Parser = Parser;
module.exports.fix = fix;

// TODO: suppress warning
// TODO: namespace re-assignment
// TODO: goog.scope
// TODO: detect missing goog.base
// TODO: detect missing dispose

/**
 */
function fix(file, info) {
  var buf = [];
  var src = fs.readFileSync(file, 'utf-8');
  if (info.provideEnd === 0) {
    getProvideRequireSrc(buf, info);
    buf.push('\n');
    buf.push(src);
  } else {
    src.split('\n').forEach(function(line, index) {
      var lineNum = index + 1;
      if (lineNum === info.provideStart) {
        getProvideRequireSrc(buf, info);
      } else if (lineNum > info.provideStart && lineNum <= info.provideEnd) {
        // skip
      } else {
        buf.push(line);
      }
    });
  }
  fs.writeFileSync(file, buf.join('\n'), 'utf8');
}

function getProvideRequireSrc(buf, info) {
  info.toProvide.forEach(function(namespace) {
    buf.push("goog.provide('" + namespace + "');");
  });
  buf.push('');
  info.toRequire.forEach(function(namespace) {
    buf.push("goog.require('" + namespace + "');");
  });
}
