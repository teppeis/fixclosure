fixclosure
====

fixclosure is JavaScript dependency checker/fixer for Closure Library based on ECMAScript AST.
It finds namespaces used in a JavaScript file and insert/remove `goog.provide` / `goog.require` automatically.

[![npm version][npm-image]][npm-url]
![Node.js Version Support][node-version]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][deps-image]][deps-url]
[![Coverage Status][coverage-image]][coverage-url]
![License][license]

## Install

```bash
$ npm install -g fixclosure
```

## Usage

Following `foo.js` requires an unused namespace `goog.unused`.
Also `goog.missing` is used but not required.

```javascript
// foo.js (before)
goog.provide('goog.foo.Bar');

goog.require('goog.foo');
goog.require('goog.unused');

goog.foo.Bar = function() {
  goog.foo.baz();
  goog.missing.require();
};
```

Fix it !

```bash
$ fixclosure --fix-in-place foo.js
File: foo.js

Provided:
- goog.foo.Bar

Required:
- goog.foo
- goog.unused

Missing Require:
- goog.missing

Unnecessary Require:
- goog.unused

FIXED!

1 files fixed
```

Fixed !  
`goog.require('goog.unused')` is removed and `goog.require('goog.missing')` is inserted.

```javascript
// foo.js (fixed!)
goog.provide('goog.foo.Bar');

goog.require('goog.foo');
goog.require('goog.missing');

goog.foo.Bar = function() {
  goog.foo.baz();
  goog.missing.require();
};
```

### Rules fixclosure checked

fixclosure checks and fixes:

* Duplicated require/provide
* Missing require/provide
* Unnecessary require/provide

### gjslint beforehand

Run [Closure Linter (gjslint)](https://developers.google.com/closure/utilities/) before fixclosure.
fixclosure is based on the assumption that target files are linted by it.

### Use with Grunt

Use [grunt-fixclosure](https://github.com/teppeis/grunt-fixclosure "grunt-fixclosure") plugin.

## Configuration file

fixclosure loads options from `.fixclosurerc` config file like:
```
--provideRoots foo,bar
--namespaceMethods foo.foo1,bar.bar1
--replaceMap foo.foobar:foo.foo
```
fixclosure will find the file in the current directory and, if not found, will move one level up the directory tree all the way up to the filesystem root.

## Options

### `-f` or `--fix-in-place`

If an invalid file is found, fixclosure fixes the file in place.

### `--config <file>`

`.fixclosurerc` file path.  
Specify if your file is not in the search path.
Default: `${process.cwd()}/.fixclosurerc`

### `--provideRoots <roots>`

Specify your root namespaces to provide. Default is `goog`.
Comma separated list.

### `--requireRoots <roots>`

Specify root namespaces to require.
Default require roots are `--provideRoots` value and `goog,proto2,soy,soydata,svgpan`.
Comma separated list.

### `--namespaceMethods <methods>`

Specify method or property exported as a namespace itself like `goog.dispose`.  
Comma separated list.

### `--depsJs <files>`

Load namespace methods from deps.js files separated by comma.
You can generate deps.js with [google-closure-deps](https://www.npmjs.com/package/google-closure-deps).

### `--replaceMap <map>`

Replace method or property to namespace mapping like `goog.disposeAll:goog.dispose`.  
Comma separated list of colon separated pairs like `foo.bar1:foo.bar2,foo.bar3:foo.bar4`.

###  `--useForwardDeclare`

Use `goog.forwardDeclare()` instead of `goog.requireType()` for types used only in JSDoc.
Default: `false`

### `--showSuccess`

Show not only failed files but also passed files.

### `--no-color`

Disable color output.

### `--roots <roots>`

*Deprecated by `--provideRoots` and `--requireRoots`. This will be removed next update.*

Specify your root namespaces in addition to default roots `goog,proto2,soy,soydata,svgpan`.
Comma separated list.

## Inline hint

fixclosure reads "hint" for lint from special comments in your code.

### `ignore`

fixclosure doesn't remove any `goog.provide` and `goog.require` with this hint.

```javascript
goog.provide('goog.foo'); // fixclosure: ignore

goog.require('goog.bar'); // fixclosure: ignore
```

In the above, `goog.provide('goog.foo')` will not removed by fixclosure even if it isn't provided in the file.
Also `goog.require('goog.bar')` will not removed if it isn't used.
The hint affects only *same* line.
Useful in module declaration.

*`fixclosure: suppressUnused` is deprecated and will be removed next update.*

### `suppressRequire`

Suppress `goog.require` auto insertion.

```javascript
// fixclosure: suppressRequire
goog.foo.bar();
```

In the above, `goog.require('goog.foo')` will not inserted.
The hint affects only *next* line.
This is useful to workaround cyclic reference.

### `suppressProvide`

Suppress `goog.provide` auto insertion.

```javascript
// fixclosure: suppressProvide
goog.Foo = function() {};
```

In the above, `goog.provide('goog.Foo')` will not inserted.
The hint affects only *next* line.

## Changelog

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

### License

MIT License: Teppei Sato <teppeis@gmail.com>

[npm-image]: https://img.shields.io/npm/v/fixclosure.svg
[npm-url]: https://npmjs.org/package/fixclosure
[npm-downloads-image]: https://img.shields.io/npm/dm/fixclosure.svg
[travis-image]: https://travis-ci.org/teppeis/fixclosure.svg?branch=master
[travis-url]: https://travis-ci.org/teppeis/fixclosure
[deps-image]: https://david-dm.org/teppeis/fixclosure.svg
[deps-url]: https://david-dm.org/teppeis/fixclosure
[node-version]: https://img.shields.io/badge/Node.js%20support-v10+-brightgreen.svg
[coverage-image]: https://coveralls.io/repos/github/teppeis/fixclosure/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/teppeis/fixclosure?branch=master
[license]: https://img.shields.io/npm/l/eslint-config-teppeis.svg
