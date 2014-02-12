goog.provide('goog.provide.dup');
goog.provide('goog.provide.dup');
goog.provide('goog.provide.no');

goog.provide('goog.require.no');
goog.require('goog.require.dup');
goog.require('goog.require.dup');

goog.provide.dup.foo = function() {
    goog.require.dup.foo();
};

goog.provide.missing.foo = function() {
    goog.require.missing.foo();
};
