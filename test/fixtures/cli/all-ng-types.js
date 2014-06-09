goog.provide('goog.provide.dup');
goog.provide('goog.provide.dup');
goog.provide('goog.provide.ignore'); // fixclosure: ignore
goog.provide('goog.provide.unnecessary');

goog.require('goog.require.dup');
goog.require('goog.require.dup');
goog.require('goog.require.ignore'); // fixclosure: ignore
goog.require('goog.require.unnecessary');

goog.provide.dup.foo = function() {
    goog.require.dup.foo();
};

goog.provide.missing.foo = function() {
    goog.require.missing.foo();
};
