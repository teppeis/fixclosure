/**
 * @typedef {goog.Foo}
 */
goog.aaa.Foo.BazType;

/**
 * @typedef {goog.Bar}
 */
goog.foo.QuxType;

// toProvide: goog.aaa.Foo
// toProvide: goog.foo.QuxType
// toRequireType: goog.Bar
// toRequireType: goog.Foo
