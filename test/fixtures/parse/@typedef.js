/**
 * @typedef {goog.Foo}
 */
goog.foo.BarType;

/**
 * @typedef {goog.Bar}
 * @private
 */
goog.foo.PrivateType;

goog.foo.NoJsDoc;

// toProvide: goog.foo.BarType
// toRequireType: goog.Bar
// toRequireType: goog.Foo
