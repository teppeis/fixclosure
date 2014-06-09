fixclosure [![Build Status](https://secure.travis-ci.org/teppeis/fixclosure.png?branch=master)](https://travis-ci.org/teppeis/fixclosure) [![Dependency Status](https://david-dm.org/teppeis/fixclosure.png)](https://david-dm.org/teppeis/fixclosure) [![Coverage Status](https://coveralls.io/repos/teppeis/fixclosure/badge.png?branch=master&1)](https://coveralls.io/r/teppeis/fixclosure)
====

fixclosure is JavaScript dependency checker/fixer for Closure Library based on Esprima.  
It finds namespaces used in a JavaScript file and insert/remove `goog.provide` / `goog.require` automatically. 

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
--roots foo,bar
--namespaceMethods foo.foo1,bar.bar1
--replaceMap foo.foobar:foo.foo
```
fixclosure will find the file in the current directory and, if not found, will move one level up the directory tree all the way up to the filesystem root. 

## Options

### `-f` or `--fix-in-place`

If an invalid file is found, fixclosure fixes the file in place.

### `--config`

`.fixclosurerc` file path.  
Specify if your file is not in the search path.

### `--roots`

Specify your root namespaces in addition to default roots `goog,proto2,soy,soydata,svgpan`.  
Comma separated list.

### `--namespaceMethods`

Specify method or property exported as a namespace itself like `goog.dispose`.  
Comma separated list.

### `--replaceMap`

Replace method or property to namespace mapping like `goog.disposeAll:goog.dispose`.  
Comma separated list of colon separated pairs like `foo.bar1:foo.bar2,foo.bar3:foo.bar4`.

### `--showSuccess`

Show not only failed files but also passed files.

### `--no-color`

Disable color output.

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

*`fixclosure: suppressUnused` is deprecated since v1.3.0.*

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

* 1.3.0 (2014/06/09)
  * Add "fixclosure: ignore" and make "suppressUnused" deprecated [#44](https://github.com/teppeis/fixclosure/pull/44)
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
