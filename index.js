var fs = require('fs');
var esprima = require('esprima');
var _ = require('underscore');
var traverse = require('./lib/traverse.js').traverse;
var Syntax = require('./lib/syntax.js');

module.exports.parse = parse;
module.exports.fix = fix;

// TODO: replace option
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

/**
 * @param {string} src
 * @return {{
 *   'provided': Array.<string>,
 *   'required': Array.<string>,
 *   'toRequire': Array.<string>
 * }}
 */
function parse(src) {
  var ast = esprima.parse(src, {loc: true});
  var parsed = parseAst(ast);
  var provided = extractProvided(parsed);
  var required = extractRequired(parsed);
  var toProvide = extractToProvide(parsed);
  var toRequire = extractToRequire(parsed, toProvide);

  return {
    'provided': provided,
    'required': required,
    'toProvide': toProvide,
    'toRequire': toRequire,
    'provideStart': min,
    'provideEnd': max
  };
}

function nameJoiner(item) {
  return item.name.join('.');
}

function extractToProvide(parsed) {
  return parsed.map(toProvideMapper).filter(isDefAndNotNull).sort().reduce(uniq, []);
}

function extractToRequire(parsed, toProvide) {
  var toRequire = parsed.map(toRequireMapper).
    filter(isDefAndNotNull).
    filter(rootFilter).
    sort().
    reduce(uniq, []);
  return _.difference(toRequire, toProvide);
}

function uniq(prev, cur) {
  if (prev[prev.length - 1] !== cur) {
    prev.push(cur);
  }
  return prev;
}

function extractProvided(parsed) {
  return parsed.map(callExpMapper('goog.provide')).filter(isDefAndNotNull).sort();
}

function extractRequired(parsed) {
  return parsed.map(callExpMapper('goog.require')).filter(isDefAndNotNull).sort();
}

/**
 * @param {Object} node
 * @return {Array.<Object>}
 */
function parseAst(node) {
  var uses = [];

  traverse(node, {
    enter: function(node) {
    },
    leave: function(node) {
      switch (node.type) {
        case Syntax.MemberExpression:
          if (hasObjectIdentifier(node)) {
            var use = registerIdentifier(node.object);
            if (use) {
              uses.push(use);
            }
          }
          break;
        default:
          break;
      }
    },
  });

  return uses;
}

/**
 * @param {Object} node
 * @return {boolean} True if the node is not computed (accessed by dot operator)
 * and the "object" property is an identifier node.
 */
function hasObjectIdentifier(node) {
  return !node.computed && node.object.type === Syntax.Identifier;
}

/**
 * @param {Object} node
 * @return {Object}
 */
function registerIdentifier(node) {
  var namespace = [node.name];
  var parentKey = node.parentKey;
  var current = node.parent;
  while (current) {
    switch (current.type) {
      case Syntax.MemberExpression:
        if (!current.computed && current.property.type === Syntax.Identifier) {
          namespace.push(current.property.name);
          parentKey = current.parentKey;
          current = current.parent;
        } else {
          return createMemberObject(namespace, current, parentKey);
        }
        break;
      default:
        return createMemberObject(namespace, current, parentKey);
    }
  }
}

/**
 * @param {Array.<string>} namespace
 * @param {Object} node
 * @param {string} key
 * @return {Object}
 */
function createMemberObject(namespace, node, key) {
  return {
    name: namespace,
    node: node,
    key: key
  };
}

/**
 * @param {*} item
 * @return {boolean} True if the item is not null nor undefined.
 */
function isDefAndNotNull(item) {
  return item != null;
}

/**
 * @param {*} item
 * @return {boolean} True if the item has a root namespace to extract.
 */
function rootFilter(item) {
  var root = item.split('.')[0]
  var roots = ['goog'];
  return _.contains(roots, root);
}

/**
 * @param {Object} use
 * @return {?string} Used namespace.
 */
function toProvideMapper(use) {
  var name = use.name.join('.');
  switch (use.node.type) {
    case Syntax.AssignmentExpression:
      if (use.key === 'left') {
        return getPackageName(name);
      }
      break;

    case Syntax.ExpressionStatement:
      // for @typedef
      return getPackageName(name);
      break;

    default:
      break;
  }
  return null;
}

/**
 * @param {Object} use
 * @return {?string} Used namespace.
 */
function toRequireMapper(use) {
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
      return getPackageName(name);
      break;

    case Syntax.AssignmentExpression:
      if (use.key === 'right') {
        return getPackageName(name);
      }
      break;

    case Syntax.VariableDeclarator:
      if (use.key === 'init') {
        return getPackageName(name);
      }
      break;

    default:
      break;
  }

  return null;
}

/**
 * @param {string} name
 * @return {?string}
 */
function getPackageName(name) {
  var name = replaceMethod(name);
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
  if (!isPackageMethod(name)) {
    lastname = names[names.length - 1];
    if (/^[a-z]/.test(lastname)) {
      // Remove the last method name.
      names.pop();
    } else if (/^[A-Z][_0-9A-Z]*$/.test(lastname)) {
      // Remove the last constant name.
      names.pop();
    }
  }

  if (names.length > 1) {
    return names.join('.');
  } else {
    // Ignore just one word namespace like 'goog'.
    return null;
  }
}

/**
 * @param {string} method Method name.
 * @return {string}
 */
function replaceMethod(method) {
  var replaceMap = {
    'goog.disposeAll': 'goog.dispose',
    //'goog.ui.KeyboardShortcutHandler.Modifiers': 'goog.ui.KeyboardShortcutHandler'
  };
  return replaceMap[method] || method;
}

/**
 * @param {string} method Method name.
 * @return {boolean}
 */
function isPackageMethod(method) {
  return method === 'goog.dispose' ||
    method === 'goog.ui.decorate';
}

// TODO
var min = Number.MAX_VALUE;
var max = 0;

/**
 * @param {string} method Method name.
 * @return {function} Filter function.
 */
function callExpMapper(method) {
  return function(use) {
    var name = use.name.join('.');
    switch (use.node.type) {
      case Syntax.CallExpression:
        if (method === name) {
          var start = use.node.loc.start.line;
          var end = use.node.loc.end.line;
          min = Math.min(min, start);
          max = Math.max(max, end);
          return use.node.arguments[0].value;
        }
        break;
      default:
        break;
    }
    return null;
  };
}
