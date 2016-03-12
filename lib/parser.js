'use strict';

var esprima = require('esprima');
var doctrine = require('doctrine');
var _ = require('underscore');
var traverse = require('estraverse').traverse;
var Syntax = require('./syntax.js');
var visitor = require('./visitor.js');
var def = require('./default.js');

/**
 * @param {Object=} opt_options .
 * @constructor
 */
var Parser = function(opt_options) {
  var options = opt_options || {};
  this.provideRoots_ = def.getRoots();
  if (options.provideRoots) {
    this.provideRoots_ = {};
    options.provideRoots.forEach(function(root) {
      this.provideRoots_[root] = true;
    }, this);
  }

  this.requireRoots_ = _.extend(def.getRoots(), this.provideRoots_);
  if (options.requireRoots) {
    this.requireRoots_ = {};
    options.requireRoots.forEach(function(root) {
      this.requireRoots_[root] = true;
    }, this);
  }

  // deprecated
  if (options.roots) {
    options.roots.forEach(function(root) {
      this.provideRoots_[root] = true;
      this.requireRoots_[root] = true;
    }, this);
  }

  this.replaceMap_ = def.getReplaceMap();
  if (options.replaceMap) {
    _.extend(this.replaceMap_, options.replaceMap);
  }

  this.namespaceMethods_ = def.getNamespaceMethods();
  if (options.namespaceMethods) {
    options.namespaceMethods.forEach(function(method) {
      this.namespaceMethods_[method] = true;
    }, this);
  }

  this.ignorePackages_ = def.getIgnorePackages();
};

/**
 * @param {string} src .
 * @return {{
 *   'provided': Array<string>,
 *   'required': Array<string>,
 *   'toRequire': Array<string>
 * }}
 */
Parser.prototype.parse = function(src) {
  var options = {
    comment: true,
    attachComment: true,
    loc: true
  };
  var ast = esprima.parse(src, options);
  var parsed = this.parseAst_(ast);
  var provided = this.extractProvided_(parsed);
  var required = this.extractRequired_(parsed);
  var ignored = this.extractSuppressUnused_(parsed, ast.comments);
  var toProvide = this.extractToProvide_(parsed, ast.comments);
  var toRequireFromJsDoc = this.extractToRequireFromJsDoc_(ast.comments);
  var toRequire = this.extractToRequire_(parsed, toProvide, ast.comments, toRequireFromJsDoc);

  return {
    'provided': provided,
    'required': required,
    'toProvide': toProvide,
    'toRequire': toRequire,
    'ignoredProvide': ignored.provide,
    'ignoredRequire': ignored.require,
    // first goog.provide or goog.require line
    'provideStart': this.min_,
    // last goog.provide or goog.require line
    'provideEnd': this.max_
  };
};

/**
 * @param {Array} parsed .
 * @param {Array} comments .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractToProvide_ = function(parsed, comments) {
  var suppressComments = this.getSuppressProvideComments_(comments);
  return parsed.
    filter(this.suppressFilter_.bind(this, suppressComments)).
    map(this.toProvideMapper_.bind(this)).
    filter(this.isDefAndNotNull_).
    filter(this.provideRootFilter_.bind(this)).
    sort().
    reduce(this.uniq_, []);
};

/**
 * @param {Array} comments .
 * @return {Array} . comments that includes @typedef and not @private
 * @private
 */
Parser.prototype.getTypedefComments_ = function(comments) {
  return comments.filter(function(comment) {
    if (comment.type === 'Block' && /^\*/.test(comment.value)) {
      var jsdoc = doctrine.parse('/*' + comment.value + '*/', {unwrap: true});
      return jsdoc.tags.some(function(tag) {
        return tag.title === 'typedef';
      }) && !jsdoc.tags.some(function(tag) {
        return tag.title === 'private';
      });
    }
  });
};

/**
 * @param {Array} comments .
 * @return {Array} .
 * @private
 */
Parser.prototype.getSuppressProvideComments_ = function(comments) {
  return comments.filter(function(comment) {
    return comment.type === 'Line' &&
      /^\s*fixclosure\s*:\s*suppressProvide\b/.test(comment.value);
  });
};

/**
 * @param {Array} comments .
 * @return {Array} .
 * @private
 */
Parser.prototype.getSuppressRequireComments_ = function(comments) {
  return comments.filter(function(comment) {
    return comment.type === 'Line' &&
      /^\s*fixclosure\s*:\s*suppressRequire\b/.test(comment.value);
  });
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
  var additional = opt_required || [];
  var suppressComments = this.getSuppressRequireComments_(comments);
  var toRequire = parsed.
    filter(this.toRequireFilter_.bind(this)).
    filter(this.suppressFilter_.bind(this, suppressComments)).
    map(this.toRequireMapper_.bind(this)).
    concat(additional).
    filter(this.isDefAndNotNull_).
    filter(this.requireRootFilter_.bind(this)).
    sort().
    reduce(this.uniq_, []);
  return _.difference(toRequire, toProvide);
};

/**
 * Require "@implements" classes and "@extends" classes with "@interface".
 * @param {Array} comments .
 * @return {Array<string>} .
 * @private
 */
Parser.prototype.extractToRequireFromJsDoc_ = function(comments) {
  return comments.filter(function(comment) {
    // JSDoc Style
    return comment.type === 'Block' && /^\*/.test(comment.value);
  }).reduce(function(prev, comment) {
    var jsdoc = doctrine.parse('/*' + comment.value + '*/', {unwrap: true});
    jsdoc.tags.forEach(function(tag) {
      if (tag.title === 'implements' && tag.type.type === 'NameExpression') {
        prev.push(tag.type.name);
      }
      if (tag.title === 'extends' && tag.type.type === 'NameExpression' &&
          this.containsJsDocTag_(jsdoc, 'interface')) {
        prev.push(tag.type.name);
      }
    }, this);
    return prev;
  }.bind(this), []);
};

/**
 * @param {!Object} jsdoc .
 * @param {string} tagName .
 * @return {boolean} .
 * @private
 */
Parser.prototype.containsJsDocTag_ = function(jsdoc, tagName) {
  for (var i in jsdoc.tags) {
    if (jsdoc.tags[i].title === tagName) {
      return true;
    }
  }
  return false;
};

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
  var suppresses = comments.filter(function(comment) {
    return comment.type === 'Line' &&
      comment.loc.start.line >= this.min_ &&
      comment.loc.start.line <= this.max_ &&
      /^\s*fixclosure\s*:\s*(?:suppressUnused|ignore)\b/.test(comment.value);
  }, this).reduce(function(prev, item) {
    prev[item.loc.start.line] = true;
    return prev;
  }, {});

  if (_.isEmpty(suppresses)) {
    return {provide: [], require: []};
  }

  var ignoredProvide = parsed.
    filter(this.callExpFilter_.bind(this, 'goog.provide')).
    filter(function(req) {
      return !!suppresses[req.node.loc.start.line];
    }).
    map(this.callExpMapper_).
    filter(this.isDefAndNotNull_).
    sort();

  var ignoredRequire = parsed.
    filter(this.callExpFilter_.bind(this, 'goog.require')).
    filter(function(req) {
      return !!suppresses[req.node.loc.start.line];
    }).
    map(this.callExpMapper_).
    filter(this.isDefAndNotNull_).
    sort();

    return {
        provide: ignoredProvide,
        require: ignoredRequire
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
  return parsed.
    filter(this.callExpFilter_.bind(this, 'goog.provide')).
    map(this.callExpMapper_).
    filter(this.isDefAndNotNull_).
    sort();
};

/**
 * @param {Array} parsed .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractRequired_ = function(parsed) {
  return parsed.
    filter(this.callExpFilter_.bind(this, 'goog.require')).
    map(this.callExpMapper_).
    filter(this.isDefAndNotNull_).
    sort();
};

/**
 * @param {Object} node .
 * @return {Array<Object>} .
 * @private
 */
Parser.prototype.parseAst_ = function(node) {
  var uses = [];
  traverse(node, {
    leave: function(currentNode, parent) {
      visitor.leave.call(this, currentNode, parent, uses);
    }
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
  var root = item.split('.')[0];
  return root in this.provideRoots_;
};

/**
 * @param {string} item .
 * @return {boolean} True if the item has a root namespace to extract.
 * @private
 */
Parser.prototype.requireRootFilter_ = function(item) {
  var root = item.split('.')[0];
  return root in this.requireRoots_;
};

/**
 * @param {Object} use .
 * @return {?string} Used namespace.
 * @private
 */
Parser.prototype.toProvideMapper_ = function(use) {
  var name = use.name.join('.');
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
      var typeDefComments = this.getTypedefComments_(use.node.leadingComments);
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
  var name = use.name.join('.');
  return this.getPackageName_(name);
};

/**
 * @param {Object} use .
 * @return {?string} Used namespace.
 * @private
 */
Parser.prototype.toRequireFilter_ = function(use) {
  switch (use.node.type) {
    case Syntax.ArrayExpression:
    case Syntax.BinaryExpression:
    case Syntax.CallExpression:
    case Syntax.ConditionalExpression:
    case Syntax.DoWhileStatement:
    case Syntax.ForInStatement:
    case Syntax.ForStatement:
    case Syntax.IfStatement:
    case Syntax.LogicalExpression:
    case Syntax.MemberExpression:
    case Syntax.NewExpression:
    case Syntax.Property:
    case Syntax.ReturnStatement:
    case Syntax.SequenceExpression:
    case Syntax.SwitchCase:
    case Syntax.SwitchStatement:
    case Syntax.ThrowStatement:
    case Syntax.UnaryExpression:
    case Syntax.UpdateExpression:
    case Syntax.WhileStatement:
      return true;

    case Syntax.AssignmentExpression:
      if (use.key === 'right') {
        return true;
      }
      break;

    case Syntax.VariableDeclarator:
      if (use.key === 'init') {
        return true;
      }
      break;

    default:
      break;
  }

  return false;
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
  var start = use.node.loc.start.line;
  var suppressComment = comments.some(function(comment) {
    return comment.loc.start.line + 1 === start;
  });
  return !suppressComment;
};

/**
 * @param {string} name .
 * @return {?string} .
 * @private
 */
Parser.prototype.getPackageName_ = function(name) {
  name = this.replaceMethod_(name);
  var names = name.split('.');
  if (this.isPrivateProp_(names)) {
    return null;
  }
  var lastname = names[names.length - 1];
  // Remove calling with apply or call.
  if ('apply' === lastname || 'call' === lastname) {
    names.pop();
    lastname = names[names.length - 1];
  }
  // Remove prototype or superClass_.
  names = names.reduceRight(function(prev, cur) {
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
    if (names.length > 2) {
      lastname = names[names.length - 1];
      var parentClass = names[names.length - 2];
      if (/^[a-z]/.test(lastname) && /^[A-Z]/.test(parentClass)) {
        names.pop();
      }
    }
  }

  var pkg = names.join('.');
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
  return !!(name in this.ignorePackages_);
};

/**
 * @param {Array<string>} names .
 * @return {boolean} .
 * @private
 */
Parser.prototype.isPrivateProp_ = function(names) {
  return names.some(function(name) {
    return (/_$/).test(name);
  });
};

/**
 * @param {string} method Method name.
 * @return {string} .
 * @private
 */
Parser.prototype.replaceMethod_ = function(method) {
  return this.replaceMap_[method] || method;
};

/**
 * @param {string} method Method name.
 * @return {boolean} .
 * @private
 */
Parser.prototype.isNamespaceMethod_ = function(method) {
  return method in this.namespaceMethods_;
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
  var name = use.name.join('.');
  switch (use.node.type) {
    case Syntax.CallExpression:
      if (method === name) {
        var start = use.node.loc.start.line;
        var end = use.node.loc.end.line;
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
