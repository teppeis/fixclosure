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

// toRequireType: goog.disposable.IDisposable
// toRequireType: goog.fx.Transition
// toRequireType: goog.fx.anim.Animated
