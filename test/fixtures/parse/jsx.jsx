<goog.foo.Element attr={goog.foo.Attribute}>
  <goog.foo.SelfClosing {...goog.foo.Spread}/>
  {goog.foo.Content}
</goog.foo.Element>

// toRequire: goog.foo.Attribute
// toRequire: goog.foo.Content
// toRequire: goog.foo.Element
// toRequire: goog.foo.SelfClosing
// toRequire: goog.foo.Spread
