goog.foo.foo();
// fixclosure: suppressRequire
goog.bar.bar();
goog.baz.baz();
// fixclosure: suppressRequire with comment
goog.qux.qux();

// toRequire: goog.baz
// toRequire: goog.foo
