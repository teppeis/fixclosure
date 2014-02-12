// "suppressRequire" affects next line

goog.foo.foo();
goog.bar.bar(); // fixclosure: suppressRequire
goog.baz.baz();

// toRequire: goog.bar
// toRequire: goog.foo
