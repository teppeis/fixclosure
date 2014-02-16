goog.require('goog.bar');
goog.require('goog.dispose');
goog.require('goog.foo.namespacemethod1');
goog.require('goog.foo.namespacemethod2');

goog.dispose(hoge);
goog.foo.namespacemethod1(hoge);
goog.foo.namespacemethod2(hoge);
goog.bar.notnamespacemethod(hoge);
