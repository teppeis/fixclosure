'use strict';

var fs = require('fs');

/**
 */
function fix(file, info) {
  var buf = [];
  var src = fs.readFileSync(file, 'utf8');
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
  fs.writeFileSync(file, buf.join('\n'), 'utf8');
}

function getProvideRequireSrc(buf, info) {
  var allToProvide = getProvideSrc(info);
  var allToRequire = getRequireSrc(info);

  allToProvide.forEach(function(provide) {
    buf.push(provide);
  });
  if (allToProvide.length > 0 && allToRequire.length > 0) {
    buf.push('');
  }
  allToRequire.forEach(function(req) {
    buf.push(req);
  });
}

function getProvideSrc(info) {
  var toProvide = info.toProvide.map(function(namespace) {
    /*jshint quotmark:false */
    return "goog.provide('" + namespace + "');";
  });
  var ignoredProvide = info.ignoredProvide.map(function(namespace) {
    /*jshint quotmark:false */
    return "goog.provide('" + namespace + "'); // fixclosure: ignore";
  });
  return toProvide.concat(ignoredProvide).sort();
}

function getRequireSrc(info) {
  var toRequire = info.toRequire.map(function(namespace) {
    /*jshint quotmark:false */
    return "goog.require('" + namespace + "');";
  });
  var ignoredRequire = info.ignoredRequire.map(function(namespace) {
    /*jshint quotmark:false */
    return "goog.require('" + namespace + "'); // fixclosure: ignore";
  });
  return toRequire.concat(ignoredRequire).sort();
}

module.exports = fix;
