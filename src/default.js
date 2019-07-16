"use strict";

/**
 * @type {Array<string>}
 */
const roots = ["goog", "proto2", "soy", "soydata", "svgpan"];

/**
 * @type {Object<string, string>}
 */
const replaceMap = {
  "goog.Disposable.MonitoringMode": "goog.Disposable",
  "goog.Promise.CancellationError": "goog.Promise",
  "goog.debug.GcDiagnostics_": "goog.debug.GcDiagnostics",
  "goog.debug.Trace_": "goog.debug.Trace",
  "goog.disposeAll": "goog.dispose",
  "goog.dom.$F": "goog.dom.forms.getValue",
  "goog.dom.BufferedViewportSizeMonitor.EventType": "goog.dom.BufferedViewportSizeMonitor",
  "goog.editor.Plugin.Op": "goog.editor.Plugin",
  "goog.ui.KeyboardShortcutHandler.Modifiers": "goog.ui.KeyboardShortcutHandler",
  "goog.ui.SplitPane.EventType": "goog.ui.SplitPane",
};

/**
 * @type {Array<string>}
 */
const ignorePackages = ["goog"];

/**
 * @type {Array<string>}
 * @deprecated Use --depsJs
 */
const providedNamespaces = [
  "goog.color.names",
  "goog.date.month",
  "goog.date.weekDay",
  "goog.debug.errorHandlerWeakDep",
  "goog.dispose",
  "goog.dom.query",
  "goog.ds.logger",
  "goog.events.actionEventWrapper",
  "goog.i18n.currencyCodeMap",
  "goog.i18n.currencyCodeMapTier2",
  "goog.i18n.mime.encode",
  "goog.labs.mock",
  "goog.labs.testing.assertThat",
  "goog.locale.countries",
  "goog.locale.defaultLocaleNameConstants",
  "goog.locale.genericFontNamesData",
  "goog.locale.nativeNameConstants",
  "goog.locale.scriptToLanguages",
  "goog.memoize",
  "goog.net.cookies",
  "goog.string.format",
  "goog.string.html.htmlSanitize",
  "goog.testing.recordConstructor",
  "goog.testing.recordFunction",
  "goog.ui.decorate",
  "goog.userAgent.product.isVersion",
];

/**
 * @return {Map<string, string>}
 */
exports.getReplaceMap = () => new Map(Object.entries(replaceMap));

/**
 * @return {Set<string>}
 */
exports.getProvidedNamespaces = () => new Set(providedNamespaces);

/**
 * @return {Set<string>}
 */
exports.getRoots = () => new Set(roots);

/**
 * @return {Set<string>}
 */
exports.getIgnorePackages = () => new Set(ignorePackages);
