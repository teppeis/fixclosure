// start with a-z
goog.foo.foo1();
goog.foo.foo2();
goog.bar.bar1();
goog.bar.bar2();
// start with $
goog.baz.$();
goog.baz.$$();
goog.baz.$F();
// only goog namespace should be require by default.
foo.bar.bar2();

// toRequire: goog.bar
// toRequire: goog.baz
// toRequire: goog.foo
