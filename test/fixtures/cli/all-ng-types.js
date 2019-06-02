goog.provide('goog.provide.dup');
goog.provide('goog.provide.dup');
goog.provide('goog.provide.ignore'); // fixclosure: ignore
goog.provide('goog.provide.unnecessary');

goog.require('goog.require.dup');
goog.require('goog.require.dup');
goog.require('goog.require.ignore'); // fixclosure: ignore
goog.require('goog.require.unnecessary');

goog.requireType('goog.requireType.dup');
goog.requireType('goog.requireType.dup');
goog.requireType('goog.requireType.ignore'); // fixclosure: ignore
goog.requireType('goog.requireType.unnecessary');

/**
 * @param {goog.requireType.dup} a
 */
goog.provide.dup.foo = function(a) {
    goog.require.dup.foo();
};

/**
 * @param {goog.requireType.missing} a
 */
goog.provide.missing.foo = function(a) {
    goog.require.missing.foo();
};
