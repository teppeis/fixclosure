goog.provide('goog.bar1');
goog.provide('goog.bar2');

goog.require('goog.baz1');
goog.require('goog.baz2');

goog.bar1 = function() {
  goog.baz1();
};

goog.bar2 = function() {
  goog.baz2();
};
