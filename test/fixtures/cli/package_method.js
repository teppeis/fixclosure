goog.require('goog.bar');
goog.require('goog.dispose');
goog.require('goog.foo.packagemethod1');
goog.require('goog.foo.packagemethod2');

goog.dispose(hoge);
goog.foo.packagemethod1(hoge);
goog.foo.packagemethod2(hoge);
goog.bar.notpackagemethod(hoge);
