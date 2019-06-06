var a = `foo${goog.foo.aaa}bar`;
var b = goog.bar.aaa`foo${goog.baz.aaa}bar`;

// toRequire: goog.bar
// toRequire: goog.baz
// toRequire: goog.foo
