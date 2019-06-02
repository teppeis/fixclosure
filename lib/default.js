'use strict';

/**
 * @type {Array<string>}
 */
const roots = ['goog', 'proto2', 'soy', 'soydata', 'svgpan'];

/**
 * @type {Object<string, string>}
 */
const replaceMap = {
  'goog.debug.GcDiagnostics_': 'goog.debug.GcDiagnostics',
  'goog.debug.Trace_': 'goog.debug.Trace',
  'goog.disposeAll': 'goog.dispose',
  'goog.dom.$F': 'goog.dom.forms.getValue',
  'goog.dom.BufferedViewportSizeMonitor.EventType': 'goog.dom.BufferedViewportSizeMonitor',
  'goog.ui.KeyboardShortcutHandler.Modifiers': 'goog.ui.KeyboardShortcutHandler',
};

/**
 * @type {Array<string>}
 */
const ignorePackages = ['goog'];

/**
 * @type {Array<string>}
 */
const namespaceMethods = [
  'goog.color.names',
  'goog.date.month',
  'goog.date.weekDay',
  'goog.debug.errorHandlerWeakDep',
  'goog.dispose',
  'goog.dom.query',
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
  'goog.string.html.htmlSanitize',
  'goog.testing.recordConstructor',
  'goog.testing.recordFunction',
  'goog.ui.decorate',
  'goog.userAgent.product.isVersion',
];

/**
 * @return {Object<string, string>}
 */
exports.getReplaceMap = function() {
  return {...replaceMap};
};

/**
 * @return {Object<string, boolean>}
 */
exports.getNamespaceMethods = function() {
  return namespaceMethods.reduce((prev, item) => {
    prev[item] = true;
    return prev;
  }, {});
};

/**
 * @return {Object<string, boolean>}
 */
exports.getRoots = function() {
  return roots.reduce((prev, item) => {
    prev[item] = true;
    return prev;
  }, {});
};

/**
 * @return {Object<string, boolean>}
 */
exports.getIgnorePackages = function() {
  return ignorePackages.reduce((prev, item) => {
    prev[item] = true;
    return prev;
  }, {});
};
