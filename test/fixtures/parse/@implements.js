/**
 * @constructor
 * @implements {goog.disposable.IDisposable}
 */
var Foo = function() {
};

/**
 * @implements {goog.fx.anim.Animated}
 * @implements {goog.fx.Transition}
 * @constructor
 */
var Bar = function() {
};

// toRequire: goog.disposable.IDisposable
// toRequire: goog.fx.Transition
// toRequire: goog.fx.anim.Animated
