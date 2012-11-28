/**
 * @constructor
 * @extends {goog.ui.Component}
 */
goog.ui.Bubble = function() {
  goog.base(this);

  /**
   * @type {goog.ui.Popup}
   * @private
   */
  this.popup_ = new goog.ui.Popup();

  /**
   * @type {string}
   * @private
   */
  this.closeButtonId_ = this.makeId('cb');
};
goog.inherits(goog.ui.Bubble, goog.ui.Component);

/**
 */
goog.ui.Bubble.prototype.hello = function() {
};

/**
 * Private class should not be provide.
 * @constructor
 * @private
 */
goog.ui.Private_ = function() {
};

// toProvide: goog.ui.Bubble
// toRequire: goog.ui.Component
// toRequire: goog.ui.Popup
