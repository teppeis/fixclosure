/**
 * Private static method should not be require or provide.
 * @private
 */
goog.dom.logger_ = goog.debug.Logger.getLogger('aaa');

/**
 */
goog.dom.hello = function() {
  goog.dom.logger_.info('bbb');
};
// toRequire: goog.debug.Logger
// toProvide: goog.dom
