import { Parser } from "./parser";
import { cli, resolveConfig } from "./cli";
import { fixInPlace, getFixedSource } from "./fix";

export {
  Parser,
  cli,
  resolveConfig,
  fixInPlace,
  // for backward compatibility
  fixInPlace as fix,
  getFixedSource,
};

// TODO: suppress warning
// TODO: namespace re-assignment
// TODO: goog.scope
// TODO: detect missing goog.base
// TODO: detect missing dispose
