/**
 * Private class should not be provide.
 * @constructor
 * @private
 */
goog.p1.Private_ = function() {
};

/**
 * A nested private class should not be provided.
 * @constructor
 * @private
 */
goog.p2.Private1_.Private2_ = function() {
};

/**
 * A nested private class should not be provided.
 * @constructor
 * @private
 */
goog.p2.Private1_.Private2_.Private3_ = function() {
};

/**
 * A method of nested private class should not be provided.
 */
goog.p2.Private1_.Private2_.Private3_.prototype.hello = function() {
};

/**
 * A static method of nested private class should not be provided.
 */
goog.p2.Private1_.Private2_.Private3_.publicStatic = function() {
};

/**
 * Private static method should not be provided,
 * but the parent namespace should be provided.
 * @private
 */
goog.p3.privateMethod_ = function() {
};

/**
 * Normal case. The parent namespace should be provided.
 */
goog.p4.hello = function() {
};

// toProvide: goog.p3
// toProvide: goog.p4
