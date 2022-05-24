import { should } from "chai";
import fs from "fs";
import type { ParserOptions } from "../../src/parser";
import { Parser } from "../../src/parser";

should();

export const assertFile = (file: string, options?: ParserOptions) => {
  let matches: RegExpExecArray | null;
  const src = fs.readFileSync(`${__dirname}/../fixtures${file}`, "utf8");

  let regex = /^\/\/ provided: (.*)/gm;
  const provided: string[] = [];
  while ((matches = regex.exec(src)) !== null) {
    provided.push(matches[1]);
  }

  regex = /^\/\/ required: (.*)/gm;
  const required: string[] = [];
  while ((matches = regex.exec(src)) !== null) {
    required.push(matches[1]);
  }

  regex = /^\/\/ requireTyped: (.*)/gm;
  const requireTyped: string[] = [];
  while ((matches = regex.exec(src)) !== null) {
    requireTyped.push(matches[1]);
  }

  regex = /^\/\/ forwardDeclared: (.*)/gm;
  const forwardDeclared: string[] = [];
  while ((matches = regex.exec(src)) !== null) {
    forwardDeclared.push(matches[1]);
  }

  regex = /^\/\/ toProvide: (.*)/gm;
  const toProvide: string[] = [];
  while ((matches = regex.exec(src)) !== null) {
    toProvide.push(matches[1]);
  }

  regex = /^\/\/ toRequire: (.*)/gm;
  const toRequire: string[] = [];
  while ((matches = regex.exec(src)) !== null) {
    toRequire.push(matches[1]);
  }

  regex = /^\/\/ toRequireType: (.*)/gm;
  const toRequireType: string[] = [];
  while ((matches = regex.exec(src)) !== null) {
    toRequireType.push(matches[1]);
  }

  regex = /^\/\/ ignoredProvide: (.*)/gm;
  const ignoredProvide: string[] = [];
  while ((matches = regex.exec(src)) !== null) {
    ignoredProvide.push(matches[1]);
  }

  regex = /^\/\/ ignoredRequire: (.*)/gm;
  const ignoredRequire: string[] = [];
  while ((matches = regex.exec(src)) !== null) {
    ignoredRequire.push(matches[1]);
  }

  options = {
    providedNamespace: [
      // 'goog' is included in deps.js of Closure Library
      "goog",
      "goog.foo",
      "goog.bar",
      "goog.baz",
      "goog.qux",
      "goog.Foo",
      "goog.Bar",
      "goog.Baz",
      "goog.Foo1",
      "goog.Foo2",
      "goog.Foo3",
      "goog.Foo4",
      "goog.Foo5",
    ],
    ...options,
  };
  const parser = new Parser(options);
  const info = parser.parse(src);
  // info.should.have.keys ['provided', 'required', 'toProvide', 'toRequire']
  info.provided.should.be.eql(provided);
  info.required.should.be.eql(required);
  info.requireTyped.should.be.eql(requireTyped);
  info.forwardDeclared.should.be.eql(forwardDeclared);
  info.toProvide.should.be.eql(toProvide);
  info.toRequire.should.be.eql(toRequire);
  info.toRequireType.should.be.eql(toRequireType);
  info.ignoredProvide.should.be.eql(ignoredProvide);
  info.ignoredRequire.should.be.eql(ignoredRequire);
};
