# fixclosure

fixclosure is JavaScript dependency checker/fixer for Closure Library based on ECMAScript AST.
It finds namespaces used in a JavaScript file and insert/remove `goog.provide`, `goog.require`, `goog.requireType` and `goog.forwardDeclare` automatically.

[![npm version][npm-image]][npm-url]
![Node.js Version Support][node-version]
[![Build Status][ci-image]][ci-url]
![License][license]

## Install

```bash
$ npm install fixclosure
```

## Usage

The following code `goog.require()`s an unused namespace `goog.unused`, also `goog.missing` is used but not `goog.require()`d.

```javascript
// foo.js (before)
goog.provide("goog.foo.Bar");

goog.require("goog.foo");
goog.require("goog.unused");

goog.foo.Bar = function () {
  goog.foo.baz();
  goog.missing.require();
};
```

Fix it !

```bash
$ npx fixclosure --fix-in-place --namespaces=goog.foo,goog.missing foo.js
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

Total: 1 files
Passed: 0 files
Fixed: 1 files
```

`goog.require('goog.unused')` is removed and `goog.require('goog.missing')` is inserted.

```javascript
// foo.js (fixed)
goog.provide("goog.foo.Bar");

goog.require("goog.foo");
goog.require("goog.missing");

goog.foo.Bar = function () {
  goog.foo.baz();
  goog.missing.require();
};
```

### Rules fixclosure checked

fixclosure checks and fixes:

- Duplicated provide/require/requireType/forwardDeclare
- Missing provide/require/requireType/forwardDeclare
- Unnecessary provide/require/requireType/forwardDeclare

### Globbing

The arguments are globbed by [globby](https://github.com/sindresorhus/globby).
Directories are expanded as `**/*.js`.

```console
$ fixclosure path/to/dir "foo/bar-*.js"
```

### Use with Grunt

Use [grunt-fixclosure](https://github.com/teppeis/grunt-fixclosure "grunt-fixclosure") plugin.

## Configuration file

fixclosure loads options from `.fixclosurerc` config file like:

```
--provideRoots foo,bar
--replaceMap foo.foobar:foo.foo
--useForwardDeclare
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

### `--namespaces <namespaces>`

Specify method or property exported as a namespace itself like `goog.dispose`.  
Comma separated list.

### `--replaceMap <map>`

Replace method or property to namespace mapping like `goog.disposeAll:goog.dispose`.  
Comma separated list of colon separated pairs like `foo.bar1:foo.bar2,foo.bar3:foo.bar4`.

### `--useForwardDeclare`

Use `goog.forwardDeclare()` instead of `goog.requireType()` for types used only in JSDoc.
Default: `false`

### `--depsJs <files>`

Load namespace methods from deps.js files separated by comma.
You can generate deps.js with [google-closure-deps](https://www.npmjs.com/package/google-closure-deps) or [duck](https://www.npmjs.com/package/@teppeis/duck).

### `--showSuccess`

Show not only failed files but also passed files.

### `--no-color`

Disable color output.

## Inline hint

fixclosure reads "hint" for lint from special comments in your code.

### `ignore`

fixclosure doesn't remove any `goog.provide` and `goog.require` with this hint.

```javascript
goog.provide("goog.foo"); // fixclosure: ignore

goog.require("goog.bar"); // fixclosure: ignore
```

In the above, `goog.provide('goog.foo')` will not removed by fixclosure even if it isn't provided in the file.
Also `goog.require('goog.bar')` will not removed if it isn't used.
The hint affects only _same_ line.
Useful in module declaration.

_`fixclosure: suppressUnused` is deprecated and will be removed next update._

### `suppressRequire`

Suppress `goog.require` auto insertion.

```javascript
// fixclosure: suppressRequire
goog.foo.bar();
```

In the above, `goog.require('goog.foo')` will not inserted.
The hint affects only _next_ line.
This is useful to workaround cyclic reference.

### `suppressProvide`

Suppress `goog.provide` auto insertion.

```javascript
// fixclosure: suppressProvide
goog.Foo = function () {};
```

In the above, `goog.provide('goog.Foo')` will not inserted.
The hint affects only _next_ line.

## Migration from v1 to v2

- Old Node.js versions were no longer supported, use Node.js v10 or higher.
- `--namespaceMethods` was deprecated, use `--namespaces`.
- Deprecated `--roots` was removed, use `--provideRoots`.
- `--requireRoots` was removed because fixclosure v2 no longer detects required namespaces heuristically. Use `--namespaces` or `--depsJs` to detect them. They can detect the namespaces correctly.
- Types used only in JSDoc are reported as errors, while previously only types of `@extends` in `@interface` are reported. Add `goog.requireType()` or `goog.fowardDeclare()`.

### License

MIT License: Teppei Sato <teppeis@gmail.com>

[npm-image]: https://badgen.net/npm/v/fixclosure?icon=npm&label=
[npm-url]: https://npmjs.org/package/fixclosure
[ci-image]: https://github.com/teppeis/fixclosure/workflows/ci/badge.svg
[ci-url]: https://github.com/teppeis/fixclosure/actions?query=workflow%3A%22ci%22
[deps-image]: https://badgen.net/david/dep/teppeis/fixclosure
[deps-url]: https://david-dm.org/teppeis/fixclosure
[node-version]: https://badgen.net/npm/node/fixclosure
[coverage-image]: https://coveralls.io/repos/github/teppeis/fixclosure/badge.svg?branch=master
[coverage-url]: https://coveralls.io/github/teppeis/fixclosure?branch=master
[license]: https://badgen.net/npm/license/fixclosure
