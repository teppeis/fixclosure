fixclosure
====
fixclosure is JavaScirpt linter/fixer based on Esprima for Google Closure Library.
now alpha version...

## Install

```bash
$ npm install -g fixclosure
```

## Usage

```bash
# Just lint
$ fixclosure foo.js

# Lint & Fix in place
$ fixclosure -f foo.js

# Specify roots of target packages in addition to "goog"
$ fixclosure --roots foo,bar foo.js

# Specify methods exported as a package itself like "goog.dispose"
$ fixclosure --packageMethods foo.foo1,bar.bar1 foo.js

# Replace method name that doesn't belong to the prefix package like "goog.disposeAll:goog.dispose"
$ fixclosure --replaceMap foo.foobar:foo.foo foo.js
```


## Changelog

* 0.1.1 (2012/11/25)
  * Scope check (by piglovesyou)
  * Root package filter works for toProvide list.
* 0.1.0 Add some options
  * Changes "fix in place" option to "-f" from "-i"
  * Implements root package filter (default: "goog")
  * Adds options --roots, --packageMethods and --replaceMap
* 0.0.2 Bugfix
* 0.0.1 Initial release

### License

MIT License: teppeis@gmail.com
