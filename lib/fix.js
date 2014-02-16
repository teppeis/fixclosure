'use strict';

var fs = require('fs');

/**
 */
function fix(file, info) {
  var buf = [];
  var src = fs.readFileSync(file, 'utf-8');
  if (info.provideEnd === 0) {
    getProvideRequireSrc(buf, info);
    buf.push('');
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
  fs.writeFileSync(file, buf.join('\n'), 'utf-8');
}

function getProvideRequireSrc(buf, info) {
  info.toProvide.forEach(function(namespace) {
    /*jshint quotmark:false */
    buf.push("goog.provide('" + namespace + "');");
  });

  var toRequire = info.toRequire.map(function(namespace) {
    /*jshint quotmark:false */
    return "goog.require('" + namespace + "');";
  });
  var suppressed = info.suppressed.map(function(namespace) {
    /*jshint quotmark:false */
    return "goog.require('" + namespace + "'); // fixclosure: suppressUnused";
  });

  if (buf.length > 0 && toRequire.length + suppressed.length > 0) {
    buf.push('');
  }

  toRequire.concat(suppressed).sort().forEach(function(req) {
    buf.push(req);
  });
}

module.exports = fix;
