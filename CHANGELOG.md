# Changelog

* 2.0.0+: See [GitHub releases](https://github.com/teppeis/fixclosure/releases)
* 1.5.4 (2016/05/29)
  * Internal: Update dependencies
  * Internal: Use ESLint and [eslint-config-teppeis](https://github.com/teppeis/eslint-config-teppeis)
  * Internal: Testing in Node v0.12, v4 and v6 on Travis.CI (v0.10 and v5 are removed)
* 1.5.3 (2016/03/16)
  * Bugfix: missing index.js in published package [#63](https://github.com/teppeis/fixclosure/pull/63)
* 1.5.2 (2016/03/15)
  * Build: use eslint-plugin-node and exclude test directory from npm package [#62](https://github.com/teppeis/fixclosure/pull/62)
* 1.5.1 (2016/03/14)
  * Bugfix: change estraverse(-fb) to dependencies [#61](https://github.com/teppeis/fixclosure/pull/61)
* 1.5.0 (2016/03/13)
  * Feat: Support JSX [#60](https://github.com/teppeis/fixclosure/pull/60)
  * Internal: Use espree instead of esprima [#59](https://github.com/teppeis/fixclosure/pull/59)
* 1.4.0 (2016/03/13)
  * Feat: Support ES6 syntax [#58](https://github.com/teppeis/fixclosure/pull/58)
* 1.3.5 (2016/03/12)
  * Internal: Use estraverse [#56](https://github.com/teppeis/fixclosure/pull/56)
  * Internal: Use istanbul for test coverage
* 1.3.4 (2016/03/10)
  * Internal: Update dependencies [#50](https://github.com/teppeis/fixclosure/pull/50), [#51](https://github.com/teppeis/fixclosure/pull/51), [#52](https://github.com/teppeis/fixclosure/pull/52)
* 1.3.3 (2016/01/05)
  * Add check for @extends using with @interface [#49](https://github.com/teppeis/fixclosure/pull/49)
* 1.3.2 (2014/06/25)
  * Bugfix: Add goog.dom.BufferedViewportSizeMonitor.EventType to default replace map [#47](https://github.com/teppeis/fixclosure/pull/47)
* 1.3.1 (2014/06/18)
  * Bugfix: Don't remove ignored provides [#46](https://github.com/teppeis/fixclosure/pull/46)
* 1.3.0 (2014/06/10)
  * Add `--provideRoots` and `--requireRoots` and make `--roots` deprecated.
  * Add "fixclosure: ignore" and make "fixclosure: suppressUnused" deprecated [#44](https://github.com/teppeis/fixclosure/pull/44)
  * Add "fixclosure: suppressProvide" [#43](https://github.com/teppeis/fixclosure/pull/43)
* 1.2.2 (2014/06/05)
  * Improve default namespace methods [#45](https://github.com/teppeis/fixclosure/pull/45)
* 1.2.1 (2014/05/30)
  * Allow comment after an inline hint [#41](https://github.com/teppeis/fixclosure/pull/41)
  * Use attachComment of Esprima 1.2 internaly [#40](https://github.com/teppeis/fixclosure/pull/40)
* 1.2.0 (2014/05/02)
  * Don't insert a blank line with --fix-in-place [#38](https://github.com/teppeis/fixclosure/pull/38)
  * Update esprima 1.2.0
* 1.1.0 (2014/04/28)
  * Update dependencies [#39](https://github.com/teppeis/fixclosure/pull/39)
* 1.0.1 (2014/04/01)
  * Fix --no-color [#37](https://github.com/teppeis/fixclosure/pull/37)
* 1.0.0 (2014/02/17)
  * Some features, bug fixes and breaking changes. See [release note ](https://github.com/teppeis/fixclosure/releases/tag/1.0.0 "Release Release 1.0.0! · teppeis/fixclosure").
* 0.2.1 (2013/11/21)
  * Fix --replaceMap
* 0.2.0 (2013/11/15)
  * Add .fixclosurerc
  * Add --no-color
* 0.1.5 (2013/11/15)
  * Update dependencies.
* 0.1.3 (2012/12/08)
  * Append package methods of Closure Library.
  * Change version option from -V to -v.
  * Change exit code of invalid argument to 1.
  * Fix for private properties.
* 0.1.2 (2012/11/28)
  * Supports const property correctly.
  * Supports a method starting with "$".
  * Ignore goog.global.
  * Don't provide @typedef type resources.
  * Fix #5 don't provide a private class.
  * Fix #6 Don't require a private method defined in the same file.
  * Add some package methods.
* 0.1.1 (2012/11/25)
  * Scope check (by piglovesyou)
  * Root package filter works for toProvide list.
* 0.1.0 Add some options
  * Changes "fix in place" option to "-f" from "-i"
  * Implements root package filter (default: "goog")
  * Adds options --roots, --namespaceMethods and --replaceMap
* 0.0.2 Bugfix
* 0.0.1 Initial release
