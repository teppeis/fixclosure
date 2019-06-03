'use strict';

const fs = require('fs');

/**
 * @param {string} file
 * @param {Object} info
 */
function fix(file, info) {
  const buf = [];
  const src = fs.readFileSync(file, 'utf8');
  let bodyStarted = false;
  if (info.provideEnd === 0) {
    writeDeclarationHeader(buf, info);
    buf.push(src);
  } else {
    src.split('\n').forEach((line, index) => {
      const lineNum = index + 1;
      if (lineNum < info.provideStart) {
        buf.push(line);
      } else if (lineNum === info.provideStart) {
        writeDeclarationHeader(buf, info);
      } else if (lineNum <= info.provideEnd) {
        // skip
      } else if (bodyStarted || line) {
        bodyStarted = true;
        buf.push(line);
      }
    });
  }
  fs.writeFileSync(file, buf.join('\n'), 'utf8');
}

/**
 * @param {Array<string>} buf
 * @param {*} info
 */
function writeDeclarationHeader(buf, info) {
  const provides = getProvideSrc(info);
  const requires = getRequireSrc(info);
  const requireTypes = getRequireTypeSrc(info);
  const forwardDeclares = getForwardDeclareSrc(info);

  if (provides.length > 0) {
    buf.push(...provides);
    buf.push('');
  }
  if (requires.length > 0) {
    buf.push(...requires);
    buf.push('');
  }
  if (requireTypes.length > 0) {
    buf.push(...requireTypes);
    buf.push('');
  }
  if (forwardDeclares.length > 0) {
    buf.push(...forwardDeclares);
    buf.push('');
  }
}

/**
 * @param {*} info
 * @return {Array<string>}
 */
function getProvideSrc(info) {
  return getDeclarationSrc(info.toProvide, info.ignoredProvide, 'goog.provide');
}

/**
 * @param {*} info
 * @return {Array<string>}
 */
function getRequireSrc(info) {
  return getDeclarationSrc(info.toRequire, info.ignoredRequire, 'goog.require');
}

/**
 * @param {*} info
 * @return {Array<string>}
 */
function getRequireTypeSrc(info) {
  return getDeclarationSrc(info.toRequireType, info.ignoredRequireType, 'goog.requireType');
}

/**
 * @param {*} info
 * @return {Array<string>}
 */
function getForwardDeclareSrc(info) {
  return getDeclarationSrc(
    info.toForwardDeclare,
    info.ignoredForwardDeclare,
    'goog.forwardDeclare'
  );
}

/**
 * @param {Array<string>} to
 * @param {Array<string>} ignored
 * @param {string} method like 'goog.require'
 * @return {Array<string>}
 */
function getDeclarationSrc(to, ignored, method) {
  const declarations = to.map(namespace => `${method}('${namespace}');`);
  const ignores = ignored.map(namespace => `${method}('${namespace}'); // fixclosure: ignore`);
  return declarations.concat(ignores).sort();
}

module.exports = fix;
