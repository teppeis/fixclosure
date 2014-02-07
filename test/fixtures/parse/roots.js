goog.foo.bar();
proto2.foo.bar();
soy.foo.bar();
soydata.foo.bar();
svgpan.foo.bar();
// baz is not a default root
baz.foo.bar();

// toRequire: goog.foo
// toRequire: proto2.foo
// toRequire: soy.foo
// toRequire: soydata.foo
// toRequire: svgpan.foo
