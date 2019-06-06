/**
 * @constructor
 * @implements {goog.Foo}
 */
var Foo = function() {
};

/**
 * @implements {goog.Bar}
 * @implements {goog.Baz}
 * @constructor
 */
var Bar = function() {
};

// toRequire: goog.Bar
// toRequire: goog.Baz
// toRequire: goog.Foo
