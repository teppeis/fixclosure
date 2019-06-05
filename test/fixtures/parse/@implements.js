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

// toRequireType: goog.Bar
// toRequireType: goog.Baz
// toRequireType: goog.Foo
