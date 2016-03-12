function foo() {
  var goog = {};
  // should not be required
  new goog.Foo();
}

function bar(goog) {
  // should not be required
  new goog.Bar();
}

(function(goog) {
  // should not be required
  new goog.Baz();
});
