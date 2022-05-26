const roots = ["goog", "proto2", "soy", "soydata", "svgpan"];

const replaceMap = {
  "goog.Disposable.MonitoringMode": "goog.Disposable",
  "goog.Promise.CancellationError": "goog.Promise",
  "goog.debug.Trace_": "goog.debug.Trace",
  "goog.dom.BufferedViewportSizeMonitor.EventType":
    "goog.dom.BufferedViewportSizeMonitor",
  "goog.editor.Plugin.Op": "goog.editor.Plugin",
  "goog.ui.SplitPane.EventType": "goog.ui.SplitPane",
};

const ignorePackages = ["goog"];

export const getReplaceMap = () => new Map(Object.entries(replaceMap));

export const getRoots = () => new Set(roots);

export const getIgnorePackages = () => new Set(ignorePackages);
