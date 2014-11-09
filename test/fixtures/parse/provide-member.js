// we do not have to provide inner class-like member (including Class, Enum, TypeDef), CONSTANT and staticMethod.
// see https://google-styleguide.googlecode.com/svn/trunk/javascriptguide.xml?showone=Providing_Dependencies_With_goog.provide#Providing_Dependencies_With_goog.provide

/**
 * @constructor
 * @extends {goog.SuperClass}
 */
goog.Class = function() {
  goog.base(this);
};
goog.inherits(goog.Class, goog.SuperClass);

/**
 */
goog.Class.prototype.method = function() {
};

/**
 * @const {number}
 */
goog.Class.CONSTANT = 0;

/**
 */
goog.Class.staticMethod = function() {
};

/**
 * @constructor
 */
goog.Class.InnerClass = function() {
};

// toProvide: goog.Class
// toRequire: goog.SuperClass
