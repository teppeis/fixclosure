// ClassDeclaration
class C1 extends goog.Foo {
  constructor() {
    goog.foo.bar();
  }
}

// ClassExpression
var C2 = class extends goog.Bar {};

// toRequire: goog.Bar
// toRequire: goog.Foo
// toRequire: goog.foo
