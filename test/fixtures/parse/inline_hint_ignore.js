goog.provide('goog.p1');
goog.provide('goog.p2'); // fixclosure: ignore

goog.require('goog.foo');
goog.require('goog.bar'); // fixclosure: ignore
goog.require('goog.baz');
goog.require('goog.bao'); // fixclosure: ignore with comment

// provided: goog.p1
// provided: goog.p2
// required: goog.bao
// required: goog.bar
// required: goog.baz
// required: goog.foo
// ignoredProvide: goog.p2
// ignoredRequire: goog.bao
// ignoredRequire: goog.bar
