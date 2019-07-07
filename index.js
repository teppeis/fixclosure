"use strict";

const Parser = require("./lib/parser");
const { cli, resolveConfig } = require("./lib/cli");
const { fixInPlace, getFixedSource } = require("./lib/fix");

module.exports = {
  Parser,
  cli,
  resolveConfig,
  fixInPlace,
  getFixedSource,
  // for backward compatibility
  fix: fixInPlace,
};

// TODO: suppress warning
// TODO: namespace re-assignment
// TODO: goog.scope
// TODO: detect missing goog.base
// TODO: detect missing dispose
