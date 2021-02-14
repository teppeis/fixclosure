const roots = ["goog", "proto2", "soy", "soydata", "svgpan"];

const replaceMap = {
  "goog.Disposable.MonitoringMode": "goog.Disposable",
  "goog.Promise.CancellationError": "goog.Promise",
  "goog.debug.GcDiagnostics_": "goog.debug.GcDiagnostics",
  "goog.debug.Trace_": "goog.debug.Trace",
  "goog.dom.$F": "goog.dom.forms.getValue",
  "goog.dom.BufferedViewportSizeMonitor.EventType": "goog.dom.BufferedViewportSizeMonitor",
  "goog.editor.Plugin.Op": "goog.editor.Plugin",
  "goog.ui.KeyboardShortcutHandler.Modifiers": "goog.ui.KeyboardShortcutHandler",
  "goog.ui.SplitPane.EventType": "goog.ui.SplitPane",
};

const ignorePackages = ["goog"];

/**
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

export const getReplaceMap = () => new Map(Object.entries(replaceMap));

export const getProvidedNamespaces = () => new Set(providedNamespaces);

export const getRoots = () => new Set(roots);

export const getIgnorePackages = () => new Set(ignorePackages);
