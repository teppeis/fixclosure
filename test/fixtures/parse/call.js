// start with a-z
goog.foo.foo1();
goog.bar.bar1();
// start with $
goog.baz.$();
// only goog namespace should be require by default.
foo.bar.bar2();

// toRequire: goog.bar
// toRequire: goog.baz
// toRequire: goog.foo
