'use strict';

var fs = require('fs');

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
    /*jshint quotmark:false */
    buf.push("goog.provide('" + namespace + "');");
  });
  buf.push('');
  info.toRequire.forEach(function(namespace) {
    /*jshint quotmark:false */
    buf.push("goog.require('" + namespace + "');");
  });
}

module.exports = fix;
