var a = `foo${goog.foo.bar}bar`;
var b = goog.tagged1.foo`foo${goog.tagged2.foo}bar`;

// toRequire: goog.foo
// toRequire: goog.tagged1
// toRequire: goog.tagged2
