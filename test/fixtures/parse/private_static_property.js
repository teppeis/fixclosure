/**
 * Private class should not be provide.
 * @constructor
 * @private
 */
goog.p1.Private_ = function() {
};

/**
 * Nested private class.
 * @constructor
 * @private
 */
goog.p2.Private1_.Private2_.Private3_ = function() {
};

/**
 * Method of nested private class.
 */
goog.p2.Private1_.Private2_.Private3_.prototype.hello = function() {
};

/**
 * Static method of nested private class.
 */
goog.p2.Private1_.Private2_.Private3_.publicStatic = function() {
};

/**
 * Private static property should not be require or provide.
 * @private
 */
goog.p3.privateProp_ = goog.debug.Logger.getLogger('aaa');

/**
 * Private static method should not be require or provide.
 * @private
 */
goog.p3.privateMethod_ = function() {
};

/**
 */
goog.p4.hello = function() {
  goog.p3.privateProp_.info('bbb');
  goog.p3.privateMethod_();
};

// toRequire: goog.debug.Logger
// toProvide: goog.p4
