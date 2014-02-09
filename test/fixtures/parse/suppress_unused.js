goog.require('goog.foo');
goog.require('goog.bar'); // fixclosure: suppressUnused
goog.require('goog.baz');

// required: goog.bar
// required: goog.baz
// required: goog.foo
// suppressed: goog.bar
