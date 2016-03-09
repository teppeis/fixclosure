'use strict';

var Syntax = require('./syntax.js');

var Visitor = function() {
  this.uses = [];
};

/**
 * @type {Array.<Object>}
 */
Visitor.prototype.uses;

Visitor.prototype.enter = null;

Visitor.prototype.leave = function(node) {
  switch (node.type) {
    case Syntax.MemberExpression:
      if (this.hasObjectIdentifier_(node) && !this.hasScope_(node)) {
        var use = this.registerIdentifier_(node.object);
        if (use) {
          this.uses.push(use);
        }
      }
      break;
    default:
      break;
  }
};

/**
 * @param {Object} node .
 * @return {boolean} True if the node is not computed (accessed by dot operator)
 * and the "object" property is an identifier node.
 * @private
 */
Visitor.prototype.hasObjectIdentifier_ = function(node) {
  return !node.computed && node.object.type === Syntax.Identifier;
};

/**
 * @param {Object} node .
 * @return {boolean} True if the node has a local or a lexical scope.
 * @private
 */
Visitor.prototype.hasScope_ = function(node) {
  var nodeName = node.object.name;
  while ((node = node.parent)) {
    switch (node.type) {
      case Syntax.FunctionExpression:
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
};

/**
 * @param {Object} node .
 * @return {Object} .
 * @private
 */
Visitor.prototype.registerIdentifier_ = function(node) {
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
          return this.createMemberObject_(namespace, current, parentKey);
        }
        break;
      default:
        return this.createMemberObject_(namespace, current, parentKey);
    }
  }
};

/**
 * @param {Array.<string>} namespace .
 * @param {Object} node .
 * @param {string} key .
 * @return {Object} .
 * @private
 */
Visitor.prototype.createMemberObject_ = function(namespace, node, key) {
  return {
    name: namespace,
    node: node,
    key: key
  };
};

module.exports = Visitor;
