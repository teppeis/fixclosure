var _ = require('underscore');

/**
 * @type {Object.<string, string>}
 */
var replaceMap = {
  'goog.debug.GcDiagnostics_': 'goog.debug.GcDiagnostics',
  'goog.debug.Trace_': 'goog.debug.Trace',
  'goog.disposeAll': 'goog.dispose',
  'goog.dom.$F': 'goog.dom.forms.getValue',
  'goog.ui.KeyboardShortcutHandler.Modifiers': 'goog.ui.KeyboardShortcutHandler'
};

/**
 * @type {Array.<string>}
 */
var packageMethods = [
  'goog.color.names',
  'goog.date.month',
  'goog.date.weekDay',
  'goog.debug.errorHandlerWeakDep',
  'goog.dispose',
  'goog.ds.logger',
  'goog.events.actionEventWrapper',
  'goog.i18n.currencyCodeMap',
  'goog.i18n.currencyCodeMapTier2',
  'goog.i18n.mime.encode',
  'goog.labs.mock',
  'goog.labs.testing.assertThat',
  'goog.locale.countries',
  'goog.locale.defaultLocaleNameConstants',
  'goog.locale.genericFontNamesData',
  'goog.locale.nativeNameConstants',
  'goog.locale.scriptToLanguages',
  'goog.memoize',
  'goog.net.cookies',
  'goog.string.format',
  'goog.testing.recordConstructor',
  'goog.testing.recordFunction',
  'goog.ui.decorate',
  'goog.userAgent.product.isVersion'
];

/**
 * @return {Object.<string, string>}
 */
exports.getReplaceMap = function() {
  return _.clone(replaceMap);
};

/**
 * @return {Object.<string, boolean>}
 */
exports.getPackageMethods = function() {
  var map = {};
  packageMethods.forEach(function(method) {
    map[method] = true;
  }, this);
  return map;
};
