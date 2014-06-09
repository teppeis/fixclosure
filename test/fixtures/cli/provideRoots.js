goog.provide('bar.Bar');
goog.provide('foo.Foo');

goog.require('bar.bar');
goog.require('foo.foo');

foo.Foo = function() {};
bar.Bar = function() {};

foo.foo.foo();
bar.bar.bar();
