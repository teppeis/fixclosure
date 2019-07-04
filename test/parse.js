"use strict";

require("chai").should();
const fs = require("fs");
const { assertFile } = require("./lib/asserts");
const assert = require("assert").strict;
const { Parser } = require("../");

describe("Parser", () => {
  context("ES5", () => {
    const files = fs.readdirSync(`${__dirname}/fixtures/parse/`);
    files.forEach(file => it(file, () => assertFile(`/parse/${file}`)));
  });

  context("ES6 script", () => {
    const files = fs.readdirSync(`${__dirname}/fixtures/parse-es6-script/`);
    files.forEach(file =>
      it(file, () => assertFile(`/parse-es6-script/${file}`, { parserOptions: {} }))
    );
  });

  context("ES6 module", () => {
    const files = fs.readdirSync(`${__dirname}/fixtures/parse-es6-module/`);
    files.forEach(file =>
      it(file, () =>
        assertFile(`/parse-es6-module/${file}`, {
          parserOptions: {
            sourceType: "module",
          },
        })
      )
    );
  });
  describe("extractType", () => {
    let parser;
    beforeEach(() => {
      parser = new Parser();
    });
    it("NameExpression", () => {
      const actual = parser.extractType({
        type: "NameExpression",
        name: "string",
      });
      assert.deepEqual(actual, ["string"]);
    });
    it("NullableType", () => {
      const actual = parser.extractType({
        type: "NullableType",
        expression: {
          type: "NameExpression",
          name: "string",
        },
        prefix: true,
      });
      assert.deepEqual(actual, ["string"]);
    });
    it("NonNullableType", () => {
      const actual = parser.extractType({
        type: "NonNullableType",
        expression: {
          type: "NameExpression",
          name: "string",
        },
        prefix: true,
      });
      assert.deepEqual(actual, ["string"]);
    });
    it("OptionalType", () => {
      const actual = parser.extractType({
        type: "OptionalType",
        expression: {
          type: "NameExpression",
          name: "string",
        },
      });
      assert.deepEqual(actual, ["string"]);
    });
    it("TypeApplication", () => {
      const actual = parser.extractType({
        type: "TypeApplication",
        expression: {
          type: "NameExpression",
          name: "Foo",
        },
        applications: [
          {
            type: "NameExpression",
            name: "Bar",
          },
          {
            type: "NameExpression",
            name: "Baz",
          },
        ],
      });
      assert.deepEqual(actual.sort(), ["Bar", "Baz", "Foo"]);
    });
    it("UnionType", () => {
      const actual = parser.extractType({
        type: "UnionType",
        elements: [
          {
            type: "NameExpression",
            name: "string",
          },
          {
            type: "NameExpression",
            name: "number",
          },
        ],
      });
      assert.deepEqual(actual.sort(), ["number", "string"]);
    });
    it("RecordType", () => {
      const actual = parser.extractType({
        type: "RecordType",
        fields: [
          {
            type: "FieldType",
            key: "foo",
            value: {
              type: "NameExpression",
              name: "string",
            },
          },
          {
            type: "FieldType",
            key: "bar",
            value: {
              type: "NameExpression",
              name: "number",
            },
          },
        ],
      });
      assert.deepEqual(actual.sort(), ["number", "string"]);
    });
    it("RecordType: null", () => {
      // Support for `@type {{foo, bar}}`
      // The properties named `foo` and `bar` have a value of ANY type.
      // See https://github.com/google/closure-compiler/wiki/Annotating-JavaScript-for-the-Closure-Compiler#record-type
      const actual = parser.extractType({
        type: "RecordType",
        fields: [
          {
            type: "FieldType",
            key: "foo",
            value: null,
          },
          {
            type: "FieldType",
            key: "bar",
            value: null,
          },
        ],
      });
      assert.deepEqual(actual.sort(), []);
    });
    it("RestType", () => {
      const actual = parser.extractType({
        type: "RestType",
        expression: {
          type: "NameExpression",
          name: "string",
        },
      });
      assert.deepEqual(actual.sort(), ["string"]);
    });
    it("FunctionType", () => {
      const actual = parser.extractType({
        type: "FunctionType",
        params: [
          {
            type: "NameExpression",
            name: "boolean",
          },
          {
            type: "RestType",
            expression: {
              type: "NameExpression",
              name: "string",
            },
          },
        ],
        result: {
          type: "NameExpression",
          name: "number",
        },
      });
      assert.deepEqual(actual.sort(), ["boolean", "number", "string"]);
    });
    it("FunctionType: this", () => {
      const actual = parser.extractType({
        type: "FunctionType",
        params: [],
        result: null,
        this: {
          type: "NameExpression",
          name: "Date",
        },
      });
      assert.deepEqual(actual.sort(), ["Date"]);
    });
    it("FunctionType: new", () => {
      const actual = parser.extractType({
        type: "FunctionType",
        params: [],
        result: null,
        this: {
          type: "NameExpression",
          name: "Date",
        },
        new: true,
      });
      assert.deepEqual(actual.sort(), ["Date"]);
    });
  });
});
