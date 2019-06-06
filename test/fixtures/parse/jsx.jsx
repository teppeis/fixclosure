<goog.Foo1 attr={goog.Foo2}>
  <goog.Foo3 {...goog.Foo4}/>
  {goog.Foo5}
</goog.Foo1>

// toRequire: goog.Foo1
// toRequire: goog.Foo2
// toRequire: goog.Foo3
// toRequire: goog.Foo4
// toRequire: goog.Foo5
