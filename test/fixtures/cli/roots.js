goog.provide('goog.Foo');
goog.provide('foo.Foo');
goog.provide('bar.Foo');

goog.require('goog.goo');
goog.require('foo.foo');
goog.require('bar.bar');

goog.Foo = function() {};
foo.Foo = function() {};
bar.Foo = function() {};

goog.goo.method(hoge);
foo.foo.method(hoge);
bar.bar.method(hoge);
baz.baz.method(hoge);
