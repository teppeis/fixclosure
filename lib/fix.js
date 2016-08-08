'use strict';

let fs = require('fs');

/**
 * @param {string} file
 * @param {Object} info
 */
function fix(file, info) {
  let buf = [];
  let src = fs.readFileSync(file, 'utf8');
  if (info.provideEnd === 0) {
    getProvideRequireSrc(buf, info);
    buf.push('');
    buf.push(src);
  } else {
    src.split('\n').forEach(function(line, index) {
      let lineNum = index + 1;
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
  let allToProvide = getProvideSrc(info);
  let allToRequire = getRequireSrc(info);

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
  let toProvide = info.toProvide.map(function(namespace) {
    return "goog.provide('" + namespace + "');";
  });
  let ignoredProvide = info.ignoredProvide.map(function(namespace) {
    return "goog.provide('" + namespace + "'); // fixclosure: ignore";
  });
  return toProvide.concat(ignoredProvide).sort();
}

function getRequireSrc(info) {
  let toRequire = info.toRequire.map(function(namespace) {
    return "goog.require('" + namespace + "');";
  });
  let ignoredRequire = info.ignoredRequire.map(function(namespace) {
    return "goog.require('" + namespace + "'); // fixclosure: ignore";
  });
  return toRequire.concat(ignoredRequire).sort();
}

module.exports = fix;
