/**
 * @constructor
 * @extends {goog.Foo}
 */
goog.aaa.Foo = function() {
  goog.base(this);

  /**
   * @type {string}
   * @private
   */
  this.closeButtonId_ = this.makeId('cb');
};
goog.inherits(goog.aaa.Foo, goog.Foo);

/**
 */
goog.aaa.Foo.prototype.hello = function() {
};

// toProvide: goog.aaa.Foo
// toRequire: goog.Foo
