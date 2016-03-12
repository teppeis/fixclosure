// ClassDeclaration
class C1 extends goog.Foo1 {
  constructor() {
    goog.foo.bar();
  }
}

// ClassExpression
var C2 = class extends goog.Foo2 {};

// toRequire: goog.Foo1
// toRequire: goog.Foo2
// toRequire: goog.foo
