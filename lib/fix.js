'use strict';

const fs = require('fs');

/**
 * @param {string} file
 * @param {Object} info
 */
function fix(file, info) {
  const buf = [];
  const src = fs.readFileSync(file, 'utf8');
  if (info.provideEnd === 0) {
    getProvideRequireSrc(buf, info);
    buf.push('');
    buf.push(src);
  } else {
    src.split('\n').forEach((line, index) => {
      const lineNum = index + 1;
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
  const allToProvide = getProvideSrc(info);
  const allToRequire = getRequireSrc(info);

  allToProvide.forEach(provide => {
    buf.push(provide);
  });
  if (allToProvide.length > 0 && allToRequire.length > 0) {
    buf.push('');
  }
  allToRequire.forEach(req => {
    buf.push(req);
  });
}

function getProvideSrc(info) {
  const toProvide = info.toProvide.map(namespace => {
    return `goog.provide('${namespace}');`;
  });
  const ignoredProvide = info.ignoredProvide.map(namespace => {
    return `goog.provide('${namespace}'); // fixclosure: ignore`;
  });
  return toProvide.concat(ignoredProvide).sort();
}

function getRequireSrc(info) {
  const toRequire = info.toRequire.map(namespace => {
    return `goog.require('${namespace}');`;
  });
  const ignoredRequire = info.ignoredRequire.map(namespace => {
    return `goog.require('${namespace}'); // fixclosure: ignore`;
  });
  return toRequire.concat(ignoredRequire).sort();
}

module.exports = fix;
