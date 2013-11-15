goog.provide('goog.bar');

goog.require('goog.baz');

goog.bar.bar1 = function() {
  goog.baz.baz1();
};

goog.bar.bar2 = function() {
  goog.baz.baz2();
};
