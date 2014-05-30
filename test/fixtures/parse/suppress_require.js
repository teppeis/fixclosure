goog.foo.foo();
// fixclosure: suppressRequire
goog.bar.bar();
goog.baz.baz();
// fixclosure: suppressRequire with comment
goog.bao.bao();

// toRequire: goog.baz
// toRequire: goog.foo
