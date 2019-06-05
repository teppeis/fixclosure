goog.provide('goog.Foo');
goog.provide('proto2.Foo');
goog.provide('soy.Foo');
goog.provide('soydata.Foo');
goog.provide('svgpan.Foo');

goog.require('goog.foo');

goog.Foo = function() {};
proto2.Foo = function() {};
soy.Foo = function() {};
soydata.Foo = function() {};
svgpan.Foo = function() {};

goog.foo.foo();
proto2.foo.foo();
soy.foo.foo();
soydata.foo.foo();
svgpan.foo.foo();
