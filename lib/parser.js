var esprima = require('esprima');
var _ = require('underscore');
var traverse = require('./traverse.js').traverse;
var Syntax = require('./syntax.js');
var Visitor = require('./visitor.js');

/**
 * @param {Object=} opt_options .
 * @constructor
 */
var Parser = function(opt_options) {
  var options = opt_options || {};
  this.roots_ = {goog: true};
  if (options.roots) {
    options.roots.forEach(function(root) {
      this.roots_[root] = true;
    }, this);
  }

  this.replaceMap_ = {
    'goog.disposeAll': 'goog.dispose',
    'goog.dom.$F': 'goog.dom.forms.getValue',
    'goog.ui.KeyboardShortcutHandler.Modifiers':
      'goog.ui.KeyboardShortcutHandler'
  };
  if (options.replaceMap) {
    _.extend(this.replaceMap_, options.replaceMap);
  }

  this.packageMethods_ = {
    'goog.color.names': true,
    'goog.date.month': true,
    'goog.date.weekDay': true,
    'goog.dispose': true,
    'goog.memoize': true,
    'goog.string.format': true,
    'goog.ui.decorate': true
  };
  if (options.packageMethods) {
    options.packageMethods.forEach(function(method) {
      this.packageMethods_[method] = true;
    }, this);
  }

  this.ignorePackages_ = ['goog.global'];
};

/**
 * @param {string} src .
 * @return {{
 *   'provided': Array.<string>,
 *   'required': Array.<string>,
 *   'toRequire': Array.<string>
 * }}
 */
Parser.prototype.parse = function(src) {
  var ast = esprima.parse(src, {loc: true});
  var parsed = this.parseAst_(ast);
  var provided = this.extractProvided_(parsed);
  var required = this.extractRequired_(parsed);
  var toProvide = this.extractToProvide_(parsed);
  var toRequire = this.extractToRequire_(parsed, toProvide);

  return {
    'provided': provided,
    'required': required,
    'toProvide': toProvide,
    'toRequire': toRequire,
    'provideStart': this.min_,
    'provideEnd': this.max_
  };
};

/**
 * @param {Array} parsed .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractToProvide_ = function(parsed) {
  return parsed.
    map(this.toProvideMapper_.bind(this)).
    filter(this.isDefAndNotNull_).
    filter(this.isNotPrivate_).
    filter(this.rootFilter_.bind(this)).
    sort().
    reduce(this.uniq_, []);
};

/**
 * @param {Array} parsed .
 * @param {Array} toProvide .
 * @return {Array} .
 * @private
 */
Parser.prototype.extractToRequire_ = function(parsed, toProvide) {
  var toRequire = parsed.
    map(this.toRequireMapper_.bind(this)).
    filter(this.isDefAndNotNull_).
    filter(this.rootFilter_.bind(this)).
    sort().
    reduce(this.uniq_, []);
  return _.difference(toRequire, toProvide);
};

/**
 * @param {Array.<string>} prev .
 * @param {string} cur .
 * @return {Array.<string>} .
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
    map(this.callExpMapper_.bind(this, 'goog.provide')).
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
    map(this.callExpMapper_.bind(this, 'goog.require')).
    filter(this.isDefAndNotNull_).
    sort();
};

/**
 * @param {Object} node .
 * @return {Array.<Object>} .
 * @private
 */
Parser.prototype.parseAst_ = function(node) {
  var visitor = new Visitor();
  traverse(node, visitor);
  return visitor.uses;
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
 * @param {string} name Class, method or property name.
 * @return {boolean} True if it doesn't have a private suffix like "test_".
 * @private
 */
Parser.prototype.isNotPrivate_ = function(name) {
  return !/_$/.test(name);
};

/**
 * @param {string} item .
 * @return {boolean} True if the item has a root namespace to extract.
 * @private
 */
Parser.prototype.rootFilter_ = function(item) {
  var root = item.split('.')[0];
  return root in this.roots_;
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
      return this.getPackageName_(name);
      break;

    case Syntax.AssignmentExpression:
      if (use.key === 'right') {
        return this.getPackageName_(name);
      }
      break;

    case Syntax.VariableDeclarator:
      if (use.key === 'init') {
        return this.getPackageName_(name);
      }
      break;

    default:
      break;
  }

  return null;
};

/**
 * @param {string} name .
 * @return {?string} .
 * @private
 */
Parser.prototype.getPackageName_ = function(name) {
  if (this.isInIgnorePackages_(name)) {
    return null;
  }
  var name = this.replaceMethod_(name);
  var names = name.split('.');
  var lastname = names[names.length - 1];
  // Remove calling with apply or call.
  if ('apply' === lastname || 'call' == lastname) {
    names.pop();
    lastname = names[names.length - 1];
  }
  // Remove prototype or superClass_.
  names = names.reduceRight(function(prev, cur) {
    if (cur === 'prototype' || cur === 'superClass_') {
      return [];
    } else {
      prev.unshift(cur);
      return prev;
    }
  }, []);
  if (!this.isPackageMethod_(name)) {
    lastname = names[names.length - 1];
    if (/^[a-z$]/.test(lastname)) {
      // Remove the last method name.
      names.pop();
    }

    while (names.length > 0) {
      lastname = names[names.length - 1];
      if (/_$/.test(lastname)) {
        // Remove the last private.
        names.pop();
      } else if (/^[A-Z][_0-9A-Z]*$/.test(lastname)) {
        // Remove the last constant name.
        names.pop();
      } else {
        break;
      }
    }
  }

  if (names.length > 1) {
    return names.join('.');
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
Parser.prototype.isInIgnorePackages_ = function(name) {
  return this.ignorePackages_.some(function(package) {
    return name.indexOf(package, 0) === 0;
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
Parser.prototype.isPackageMethod_ = function(method) {
  return method in this.packageMethods_;
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
Parser.prototype.callExpMapper_ = function(method, use) {
  var name = use.name.join('.');
  switch (use.node.type) {
    case Syntax.CallExpression:
      if (method === name) {
        var start = use.node.loc.start.line;
        var end = use.node.loc.end.line;
        this.min_ = Math.min(this.min_, start);
        this.max_ = Math.max(this.max_, end);
        return use.node.arguments[0].value;
      }
      break;
    default:
      break;
  }
  return null;
};

/**
 * export Pareser
 */
module.exports = Parser;
