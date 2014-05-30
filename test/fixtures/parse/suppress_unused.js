goog.require('goog.foo');
goog.require('goog.bar'); // fixclosure: suppressUnused
goog.require('goog.baz');
goog.require('goog.bao'); // fixclosure: suppressUnused with comment

// required: goog.bao
// required: goog.bar
// required: goog.baz
// required: goog.foo
// suppressed: goog.bao
// suppressed: goog.bar
