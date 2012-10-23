/**
 * @param {string} arg1 Arg1.
 * @param {string|Element} opt_arg2 Arg2.
 * @param {goog.dom.DomHelper=} opt_domHelper
 * @constructor
 * @extends {goog.ui.Component}
 */
goog.ui.Bubble = function(arg1, opt_arg2, opt_domHelper) {
  goog.base(this, opt_domHelper);

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

// toProvide: goog.ui.Bubble
// toRequire: goog.ui.Component
// toRequire: goog.ui.Popup
