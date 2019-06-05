'use strict';

const parser = require('@babel/parser');
const doctrine = require('doctrine');
const difference = require('lodash.difference');
const flat = require('array.prototype.flat');
const estraverse = require('estraverse-fb');
const {traverse} = estraverse;
const {Syntax} = estraverse;
const visitor = require('./visitor');
const def = require('./default');

/**
 * @param {Object=} opt_options .
 * @constructor
 */
const Parser = function(opt_options) {
  const options = (this.options = opt_options || {});
  if (options.provideRoots) {
    this.provideRoots_ = new Set(options.provideRoots);
  } else {
    this.provideRoots_ = def.getRoots();
  }

  if (options.requireRoots) {
    this.requireRoots_ = new Set(options.requireRoots);
  } else {
    this.requireRoots_ = def.getRoots();
    this.provideRoots_.forEach(root => {
      this.requireRoots_.add(root);
    });
  }

  this.replaceMap_ = def.getReplaceMap();
  if (options.replaceMap) {
    options.replaceMap.forEach((value, key) => {
      this.replaceMap_.set(key, value);
    });
  }

  this.namespaceMethods_ = def.getNamespaceMethods();
  if (options.namespaceMethods) {
    options.namespaceMethods.forEach(method => {
      this.namespaceMethods_.add(method);
    });
  }

  this.ignorePackages_ = def.getIgnorePackages();
};

/**
 * @param {string} src .
 */
Parser.prototype.parse = function(src) {
  const options = {
    comment: true,
    attachComment: true,
    loc: true,
    ecmaVersion: 2019,
    ecmaFeatures: {
      jsx: true,
    },
    plugins: ['estree', 'jsx'],
    ...this.options.parserOptions,
  };
  const {program, comments} = parser.parse(src, options);
  // Convert from @babel/parser to espree style AST
  program.comments = comments;
  const parsed = this.parseAst_(program);
  const provided = this.extractProvided_(parsed);
  const required = this.extractRequired_(parsed);
  const requireTyped = this.extractRequireTyped_(parsed);
  const forwardDeclared = this.extractForwardDeclared_(parsed);
  const ignored = this.extractSuppressUnused_(parsed, program.comments);
  const toProvide = this.extractToProvide_(parsed, program.comments);
  const toRequire = this.extractToRequire_(parsed, toProvide, program.comments);
  const toRequireTypwRaw = this.extractToRequireTypeFromJsDoc_(program.comments);
  const toRequireType = difference(toRequireTypwRaw, toProvide, toRequire);

  return {
    provided,
    required,
    requireTyped,
    forwardDeclared,
    toProvide,
    toRequire,
    toRequireType,
    toForwardDeclare: [],
    ignoredProvide: ignored.provide,
    ignoredRequire: ignored.require,
    ignoredRequireType: ignored.requireType,
    ignoredForwardDeclare: ignored.forwardDeclare,
    // first goog.provide or goog.require line
    provideStart: this.min_,
    // last goog.provide or goog.require line
    provideEnd: this.max_,
  };
};

/**
 * @param {Array} parsed .
 * @param {Array} comments .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractToProvide_ = function(parsed, comments) {
  const suppressComments = this.getSuppressProvideComments_(comments);
  return parsed
    .filter(this.suppressFilter_.bind(this, suppressComments))
    .map(this.toProvideMapper_.bind(this))
    .filter(this.isDefAndNotNull_)
    .filter(this.provideRootFilter_.bind(this))
    .sort()
    .reduce(this.uniq_, []);
};

/**
 * @param {Array} comments .
 * @return {Array} . comments that includes @typedef and not @private
 * @private
 */
Parser.prototype.getTypedefComments_ = function(comments) {
  return comments.filter(comment => {
    if (comment.type === 'CommentBlock' && /^\*/.test(comment.value)) {
      const jsdoc = doctrine.parse(`/* ${comment.value}*/`, {unwrap: true});
      return (
        jsdoc.tags.some(tag => tag.title === 'typedef') &&
        !jsdoc.tags.some(tag => tag.title === 'private')
      );
    }
    return false;
  });
};

/**
 * @param {Array} comments .
 * @return {Array} .
 * @private
 */
Parser.prototype.getSuppressProvideComments_ = function(comments) {
  return comments.filter(
    comment =>
      comment.type === 'CommentLine' && /^\s*fixclosure\s*:\s*suppressProvide\b/.test(comment.value)
  );
};

/**
 * @param {Array} comments .
 * @return {Array} .
 * @private
 */
Parser.prototype.getSuppressRequireComments_ = function(comments) {
  return comments.filter(
    comment =>
      comment.type === 'CommentLine' && /^\s*fixclosure\s*:\s*suppressRequire\b/.test(comment.value)
  );
};

/**
 * @param {Array} parsed .
 * @param {Array} toProvide .
 * @param {Array} comments .
 * @param {Array=} opt_required .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractToRequire_ = function(parsed, toProvide, comments, opt_required) {
  const additional = opt_required || [];
  const suppressComments = this.getSuppressRequireComments_(comments);
  const toRequire = parsed
    .filter(this.toRequireFilter_.bind(this))
    .filter(this.suppressFilter_.bind(this, suppressComments))
    .map(this.toRequireMapper_.bind(this))
    .concat(additional)
    .filter(this.isDefAndNotNull_)
    .filter(this.requireRootFilter_.bind(this))
    .sort()
    .reduce(this.uniq_, []);
  return difference(toRequire, toProvide);
};

/**
 * Require "@implements" classes and "@extends" classes with "@interface".
 * @param {Array} comments .
 * @return {Array<string>} .
 * @private
 */
Parser.prototype.extractToRequireTypeFromJsDoc_ = function(comments) {
  return comments
    .filter(
      comment =>
        // JSDoc Style
        comment.type === 'CommentBlock' && /^\*/.test(comment.value)
    )
    .reduce((prev, comment) => {
      const jsdoc = doctrine.parse(`/* ${comment.value}*/`, {unwrap: true});
      jsdoc.tags
        .filter(tag => tagsHavingType.has(tag.title) && tag.type)
        .map(tag => this.extractType(tag.type))
        .forEach(names => {
          prev.push(...names);
        });
      return prev;
    }, [])
    .filter(this.requireRootFilter_.bind(this))
    .sort()
    .reduce(this.uniq_, []);
};

Parser.prototype.extractType = function(type) {
  let result;
  switch (type.type) {
    case 'NameExpression':
      return [type.name];
    case 'NullableType':
    case 'NonNullableType':
    case 'OptionalType':
    case 'RestType':
      return this.extractType(type.expression);
    case 'TypeApplication':
      result = this.extractType(type.expression);
      result.push(...flat(type.applications.map(app => this.extractType(app))));
      break;
    case 'UnionType':
      return flat(type.elements.map(el => this.extractType(el)));
    case 'RecordType':
      return flat(type.fields.map(field => this.extractType(field)));
    case 'FieldType':
      if (type.value) {
        return this.extractType(type.value);
      } else {
        return [];
      }
    case 'FunctionType':
      result = flat(type.params.map(param => this.extractType(param)));
      if (type.result) {
        result.push(...this.extractType(type.result));
      }
      if (type.this) {
        result.push(...this.extractType(type.this));
      }
      break;
    default:
      result = [];
  }
  return result;
};

const tagsHavingType = new Set([
  'const',
  'define',
  'enum',
  'extends',
  'implements',
  'param',
  'return',
  'this',
  'type',
]);

/**
 * Extract "goog.require('goog.foo') // fixclosure: ignore".
 * "suppressUnused" is deprecated.
 *
 * @param {Array} parsed .
 * @param {Array} comments .
 * @return {Array<string>} .
 * @private
 */
Parser.prototype.extractSuppressUnused_ = function(parsed, comments) {
  const suppresses = comments
    .filter(
      comment =>
        comment.type === 'CommentLine' &&
        comment.loc.start.line >= this.min_ &&
        comment.loc.start.line <= this.max_ &&
        /^\s*fixclosure\s*:\s*(?:suppressUnused|ignore)\b/.test(comment.value)
    )
    .reduce((prev, item) => {
      prev[item.loc.start.line] = true;
      return prev;
    }, {});

  if (Object.keys(suppresses).length === 0) {
    return {provide: [], require: [], requireType: [], forwardDeclare: []};
  }

  const getSuppressedNamespaces = method =>
    parsed
      .filter(this.callExpFilter_.bind(this, method))
      .filter(req => !!suppresses[req.node.loc.start.line])
      .map(this.callExpMapper_)
      .filter(this.isDefAndNotNull_)
      .sort();

  return {
    provide: getSuppressedNamespaces('goog.provide'),
    require: getSuppressedNamespaces('goog.require'),
    requireType: getSuppressedNamespaces('goog.requireType'),
    forwardDeclare: getSuppressedNamespaces('goog.forwardDeclare'),
  };
};

/**
 * @param {Array<string>} prev .
 * @param {string} cur .
 * @return {Array<string>} .
 * @private
 */
Parser.prototype.uniq_ = function(prev, cur) {
  if (prev[prev.length - 1] !== cur) {
    prev.push(cur);
  }
  return prev;
};

/**
 * @param {Array} parsed .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractProvided_ = function(parsed) {
  return this.extractGoogDeclaration_(parsed, 'goog.provide');
};

/**
 * @param {Array} parsed .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractRequired_ = function(parsed) {
  return this.extractGoogDeclaration_(parsed, 'goog.require');
};

/**
 * @param {Array} parsed .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractRequireTyped_ = function(parsed) {
  return this.extractGoogDeclaration_(parsed, 'goog.requireType');
};

/**
 * @param {Array} parsed .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractForwardDeclared_ = function(parsed) {
  return this.extractGoogDeclaration_(parsed, 'goog.forwardDeclare');
};

/**
 * @param {Array} parsed .
 * @param {string} method like 'goog.provide' or 'goog.require'
 * @return {Array} .
 * @private
 */
Parser.prototype.extractGoogDeclaration_ = function(parsed, method) {
  return parsed
    .filter(this.callExpFilter_.bind(this, method))
    .map(this.callExpMapper_)
    .filter(this.isDefAndNotNull_)
    .sort();
};

/**
 * @param {Object} node .
 * @return {Array<Object>} .
 * @private
 */
Parser.prototype.parseAst_ = function(node) {
  const uses = [];
  traverse(node, {
    leave(currentNode, parent) {
      visitor.leave.call(this, currentNode, parent, uses);
    },
  });
  return uses;
};

/**
 * @param {*} item .
 * @return {boolean} True if the item is not null nor undefined.
 * @private
 */
Parser.prototype.isDefAndNotNull_ = function(item) {
  return item != null;
};

/**
 * @param {string} item .
 * @return {boolean} True if the item has a root namespace to extract.
 * @private
 */
Parser.prototype.provideRootFilter_ = function(item) {
  const root = item.split('.')[0];
  return this.provideRoots_.has(root);
};

/**
 * @param {string} item .
 * @return {boolean} True if the item has a root namespace to extract.
 * @private
 */
Parser.prototype.requireRootFilter_ = function(item) {
  const root = item.split('.')[0];
  return this.requireRoots_.has(root);
};

/**
 * @param {Object} use .
 * @return {?string} Used namespace.
 * @private
 */
Parser.prototype.toProvideMapper_ = function(use) {
  const name = use.name.join('.');
  let typeDefComments;
  switch (use.node.type) {
    case Syntax.AssignmentExpression:
      if (use.key === 'left') {
        return this.getPackageName_(name);
      }
      break;
    case Syntax.ExpressionStatement:
      if (!use.node.leadingComments) {
        return null;
      }
      typeDefComments = this.getTypedefComments_(use.node.leadingComments);
      if (typeDefComments.length > 0) {
        return this.getPackageName_(name);
      }
      break;

    default:
      break;
  }
  return null;
};

/**
 * @param {Object} use .
 * @return {?string} Used namespace.
 * @private
 */
Parser.prototype.toRequireMapper_ = function(use) {
  const name = use.name.join('.');
  return this.getPackageName_(name);
};

/**
 * @param {Object} use .
 * @return {?string} Used namespace.
 * @private
 */
Parser.prototype.toRequireFilter_ = function(use) {
  switch (use.node.type) {
    case Syntax.ExpressionStatement:
      return false;

    case Syntax.AssignmentExpression:
      if (use.key === 'left') {
        return false;
      }
      break;

    case Syntax.VariableDeclarator:
      if (use.key === 'id') {
        return false;
      }
      break;

    default:
      break;
  }

  return true;
};

/**
 * Filter toProvide and toRequire if it is suppressed.
 *
 * @param {Array} comments .
 * @param {Object} use .
 * @return {?string} Used namespace.
 * @private
 */
Parser.prototype.suppressFilter_ = function(comments, use) {
  const start = use.node.loc.start.line;
  const suppressComment = comments.some(comment => comment.loc.start.line + 1 === start);
  return !suppressComment;
};

/**
 * @param {string} name .
 * @return {?string} .
 * @private
 */
Parser.prototype.getPackageName_ = function(name) {
  name = this.replaceMethod_(name);
  let names = name.split('.');
  if (this.isPrivateProp_(names)) {
    return null;
  }
  let lastname = names[names.length - 1];
  // Remove calling with apply or call.
  if (lastname === 'apply' || lastname === 'call') {
    names.pop();
    lastname = names[names.length - 1];
  }
  // Remove prototype or superClass_.
  names = names.reduceRight((prev, cur) => {
    if (cur === 'prototype') {
      return [];
    } else {
      prev.unshift(cur);
      return prev;
    }
  }, []);
  if (!this.isNamespaceMethod_(name)) {
    lastname = names[names.length - 1];
    if (/^[a-z$]/.test(lastname)) {
      // Remove the last method name.
      names.pop();
    }

    while (names.length > 0) {
      lastname = names[names.length - 1];
      if (/^[A-Z][_0-9A-Z]*$/.test(lastname)) {
        // Remove the last constant name.
        names.pop();
      } else {
        break;
      }
    }

    // Remove the static property.
    const PARENT_CLASS_INDEX_FROM_LAST = 2;
    if (names.length > PARENT_CLASS_INDEX_FROM_LAST) {
      lastname = names[names.length - 1];
      const parentClass = names[names.length - PARENT_CLASS_INDEX_FROM_LAST];
      if (/^[a-z]/.test(lastname) && /^[A-Z]/.test(parentClass)) {
        names.pop();
      }
    }
  }

  const pkg = names.join('.');
  if (pkg && !this.isIgnorePackage_(pkg)) {
    return this.replaceMethod_(pkg);
  } else {
    // Ignore just one word namespace like 'goog'.
    return null;
  }
};

/**
 * @param {string} name .
 * @return {boolean} .
 * @private
 */
Parser.prototype.isIgnorePackage_ = function(name) {
  return this.ignorePackages_.has(name);
};

/**
 * @param {Array<string>} names .
 * @return {boolean} .
 * @private
 */
Parser.prototype.isPrivateProp_ = function(names) {
  return names.some(name => name.endsWith('_'));
};

/**
 * @param {string} method Method name.
 * @return {string} .
 * @private
 */
Parser.prototype.replaceMethod_ = function(method) {
  return this.replaceMap_.has(method) ? this.replaceMap_.get(method) : method;
};

/**
 * @param {string} method Method name.
 * @return {boolean} .
 * @private
 */
Parser.prototype.isNamespaceMethod_ = function(method) {
  return this.namespaceMethods_.has(method);
};

/**
 * @type {number}
 * @private
 */
Parser.prototype.min_ = Number.MAX_VALUE;

/**
 * @type {number}
 * @private
 */
Parser.prototype.max_ = 0;

/**
 * @param {string} method Method name.
 * @param {Object} use .
 * @return {?string} .
 * @private
 */
Parser.prototype.callExpFilter_ = function(method, use) {
  const name = use.name.join('.');
  switch (use.node.type) {
    case Syntax.CallExpression:
      if (method === name) {
        const start = use.node.loc.start.line;
        const end = use.node.loc.end.line;
        this.min_ = Math.min(this.min_, start);
        this.max_ = Math.max(this.max_, end);
        return true;
      }
      break;
    default:
      break;
  }
  return false;
};

/**
 * @param {Object} use .
 * @return {?string} .
 * @private
 */
Parser.prototype.callExpMapper_ = function(use) {
  return use.node.arguments[0].value;
};

/**
 * export Pareser
 */
module.exports = Parser;
