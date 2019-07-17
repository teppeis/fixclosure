fixclosure
====

fixclosure is JavaScript dependency checker/fixer for Closure Library based on ECMAScript AST.
It finds namespaces used in a JavaScript file and insert/remove `goog.provide`, `goog.require`, `goog.requireType` and `goog.forwardDeclare` automatically.

[![npm version][npm-image]][npm-url]
![Node.js Version Support][node-version]
[![Build Status][circleci-image]][circleci-url]
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

* Duplicated provide/require/requireType/forwardDeclare
* Missing provide/require/requireType/forwardDeclare
* Unnecessary provide/require/requireType/forwardDeclare

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

### License

MIT License: Teppei Sato <teppeis@gmail.com>

[npm-image]: https://img.shields.io/npm/v/fixclosure.svg
[npm-url]: https://npmjs.org/package/fixclosure
[npm-downloads-image]: https://img.shields.io/npm/dm/fixclosure.svg
[circleci-image]: https://circleci.com/gh/teppeis/fixclosure.svg?style=shield
[circleci-url]: https://circleci.com/gh/teppeis/fixclosure
[deps-image]: https://david-dm.org/teppeis/fixclosure.svg
[deps-url]: https://david-dm.org/teppeis/fixclosure
[node-version]: https://img.shields.io/badge/Node.js%20support-v10+-brightgreen.svg
[coverage-image]: https://coveralls.io/repos/github/teppeis/fixclosure/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/teppeis/fixclosure?branch=master
[license]: https://img.shields.io/npm/l/eslint-config-teppeis.svg
