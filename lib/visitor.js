'use strict';

var Syntax = require('estraverse').Syntax;

/**
 * Visitor for estraverse.
 *
 * @param {Object} node .
 * @param {Object} parent .
 * @param {Array<string>} uses .
 * @this {estravarse.Controller}
 */
function leave(node, parent, uses) {
  switch (node.type) {
    case Syntax.MemberExpression:
    case Syntax.JSXMemberExpression:
      if (hasObjectIdentifier_(node) && !hasScope_(node, this.parents())) {
        var parents = this.parents().concat(node).reverse();
        var path = this.path().concat('object').reverse();
        var use = registerIdentifier_(node.object, parents, path);
        if (use) {
          uses.push(use);
        }
      }
      break;
    default:
      break;
  }
}

/**
 * @param {Object} node .
 * @return {boolean} True if the node is not computed (accessed by dot operator)
 * and the "object" property is an identifier node.
 * @private
 */
function hasObjectIdentifier_(node) {
  return !node.computed && isIdentifierType_(node.object.type);
}

/**
 * @param {string} type .
 * @return {boolean} True if the type is Syntax.Identifier or
 * Syntax.JSXIdentifier.
 */
function isIdentifierType_(type) {
  return type === Syntax.Identifier || type === Syntax.JSXIdentifier;
}

/**
 * @param {Object} node .
 * @param {Array<Object>} parents .
 * @return {boolean} True if the node has a local or a lexical scope.
 * @private
 */
function hasScope_(node, parents) {
  var nodeName = node.object.name;
  parents = parents.slice();
  while ((node = parents.pop())) {
    switch (node.type) {
      case Syntax.FunctionExpression:
      case Syntax.FunctionDeclaration:
        if (node.params &&
            node.params.some(function(param) {
              return param.name === nodeName;
            })) {
          return true;
        }
        break;
      case Syntax.BlockStatement:
        if (node.body &&
            node.body.some(function(bodyPart) {
              return bodyPart.type === Syntax.VariableDeclaration &&
                bodyPart.declarations.some(function(declaration) {
                  return declaration.type === Syntax.VariableDeclarator &&
                    declaration.id.name === nodeName;
                });
            })) {
          return true;
        }
        break;
    }
  }
  return false;
}

/**
 * @param {Object} node .
 * @param {Array<Object>} parents .
 * @param {Array<string>} path .
 * @return {Object} .
 * @private
 */
function registerIdentifier_(node, parents, path) {
  var namespace = [node.name];
  for (var i = 0; i < parents.length; i++) {
    var current = parents[i];
    var parentKey = path[i];
    switch (current.type) {
      case Syntax.MemberExpression:
      case Syntax.JSXMemberExpression:
        if (!current.computed && isIdentifierType_(current.property.type)) {
          namespace.push(current.property.name);
        } else {
          return createMemberObject_(namespace, current, parentKey);
        }
        break;
      default:
        return createMemberObject_(namespace, current, parentKey);
    }
  }
}

/**
 * @param {Array<string>} namespace .
 * @param {Object} node .
 * @param {string} parentKey .
 * @return {Object} .
 * @private
 */
function createMemberObject_(namespace, node, parentKey) {
  return {
    name: namespace,
    node: node,
    key: parentKey
  };
}

module.exports = {
  leave: leave
};
