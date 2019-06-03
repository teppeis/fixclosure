'use strict';

const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const commander = require('commander');
const difference = require('lodash.difference');
const fix = require('./fix');
const Parser = require('./parser');
const Logger = require('./clilogger');
const pkg = require('../package.json');
const {parser: depsJsParser} = require('google-closure-deps');
const flat = require('array.prototype.flat');

function list(val) {
  return val.split(',');
}

function map(val) {
  const mapping = {};
  val.split(',').forEach(item => {
    const entry = item.split(':');
    mapping[entry[0]] = entry[1];
  });
  return mapping;
}

function setCommandOptions(command) {
  return command
    .version(pkg.version, '-v, --version')
    .usage('[options] files...')
    .option('-f, --fix-in-place', 'Fix the file in-place.')
    .option('--provideRoots <roots>', 'Root namespaces to provide separated by comma.', list)
    .option('--requireRoots <roots>', 'Root namespaces to require separated by comma.', list)
    .option(
      '--roots <roots>',
      '(deprecated) Additional root namespaces to provide or require separated by comma.',
      list
    )
    .option(
      '--namespaceMethods <methods>',
      'Methods or properties which are also namespaces separated by comma.',
      list
    )
    .option(
      '--replaceMap <map>',
      'Methods or properties to namespaces mapping like "before1:after1,before2:after2".',
      map
    )
    .option(
      '--useForwardDeclare',
      'Use goog.forwardDeclare() instead of goog.requireType().',
      false
    )
    .option('--config <file>', '.fixclosurerc file path.')
    .option('--depsJs <file>', 'deps.js file path.')
    .option('--showSuccess', 'Show success ouput.', false)
    .option('--no-color', 'Disable color highlight.');
}

function getDuplicated(namespaces) {
  const dups = new Set();
  namespaces.reduce((prev, cur) => {
    if (prev === cur) {
      dups.add(cur);
    }
    return cur;
  }, null);
  return [...dups];
}

/**
 * Find .fixclosurerc up from current working dir
 * @return {string|null}
 */
function findConfig() {
  return findConfig_(process.cwd());
}

const findConfig_ = memoize(dir => {
  const name = '.fixclosurerc';

  const filename = path.normalize(path.join(dir, name));
  try {
    fs.accessSync(filename);
    return filename;
  } catch (e) {
    // ignore
  }

  const parent = path.resolve(dir, '../');
  if (dir === parent) {
    return null;
  }

  return findConfig_(parent);
});

/**
 * Load .fixclosurerc to argv
 * @param {Array} argv
 * @return {Array}
 */
function loadConfig(argv) {
  const command = setCommandOptions(new commander.Command());
  command.parse(argv);
  const configPath = command.config || findConfig();
  if (configPath) {
    const opts = fs
      .readFileSync(configPath, 'utf8')
      .trim()
      .split(/\s+/);
    argv = argv.slice(0, 2).concat(opts.concat(argv.slice(2)));
  }
  return argv;
}

/**
 * @param {Array} argv
 * @param {Stream} stdout
 * @param {Stream} stderr
 * @param {function(number?)} exit
 * @return {Promise<void>}
 */
async function main(argv, stdout, stderr, exit) {
  argv = loadConfig(argv);

  const program = new commander.Command();
  setCommandOptions(program).parse(argv);

  if (program.args.length < 1) {
    program.outputHelp();
    exit(1);
  }

  let symbols = [];
  if (program.depsJs) {
    const {dependencies} = await depsJsParser.parseFileAsync(program.depsJs);
    /** @type {string[]} */
    symbols = flat(dependencies.map(dep => dep.closureSymbols));
  }

  let ok = 0;
  let ng = 0;
  let fixed = 0;
  const log = new Logger(program.color, stdout, stderr);

  program.args.forEach(file => {
    log.warn(`File: ${file}\n`);
    const src = fs.readFileSync(file, 'utf8');
    const options = {
      provideRoots: program.provideRoots,
      requireRoots: program.requireRoots,
      roots: program.roots,
      namespaceMethods: symbols.concat(program.namespaceMethods),
      replaceMap: program.replaceMap,
    };
    const parser = new Parser(options);
    const info = parser.parse(src);

    if (program.useForwardDeclare) {
      info.toForwardDeclare = info.toRequireType;
      info.toRequireType = [];
    }
    log.info('Provided:');
    log.items(
      info.provided.map(item => item + (info.ignoredProvide.includes(item) ? ' (ignored)' : ''))
    );
    log.info('');
    log.info('Required:');
    log.items(
      info.required.map(item => item + (info.ignoredRequire.includes(item) ? ' (ignored)' : ''))
    );
    log.info('');
    if (info.requireTyped.length > 0) {
      log.info('RequireTyped:');
      log.items(
        info.requireTyped.map(
          item => item + (info.ignoredRequireType.includes(item) ? ' (ignored)' : '')
        )
      );
      log.info('');
    }
    if (info.forwardDeclared.length > 0) {
      log.info('ForwardDeclared:');
      log.items(
        info.forwardDeclared.map(
          item => item + (info.ignoredForwardDeclare.includes(item) ? ' (ignored)' : '')
        )
      );
      log.info('');
    }

    let needToFix = false;
    needToFix =
      checkDeclare(log, 'Provide', info.provided, info.toProvide, info.ignoredProvide) || needToFix;
    needToFix =
      checkDeclare(log, 'Require', info.required, info.toRequire, info.ignoredRequire) || needToFix;
    needToFix =
      checkDeclare(
        log,
        'RequireType',
        info.requireTyped,
        info.toRequireType,
        info.ignoredRequireType,
        info.forwardDeclared,
        info.toForwardDeclare
      ) || needToFix;
    needToFix =
      checkDeclare(
        log,
        'ForwardDeclare',
        info.forwardDeclared,
        info.toForwardDeclare,
        info.ignoredForwardDeclare,
        info.requireTyped,
        info.toRequireType
      ) || needToFix;

    if (needToFix) {
      if (program.fixInPlace) {
        fix(file, info);
        log.raw('FIXED!', clc.cyan);
        fixed++;
      } else {
        log.error('FAIL!');
        ng++;
      }
      log.flush(false);
    } else {
      ok++;
      log.success('GREEN!');
      if (program.showSuccess) {
        log.flush(true);
      } else {
        log.empty();
      }
    }
  });

  const total = ok + ng + fixed;
  log.info('');
  if (ng) {
    log.error(`${ng} of ${total} files failed`);
    if (fixed) {
      log.warn(`${fixed} files fixed`);
    }
    log.flush(false);
    exit(1);
  } else {
    log.success(`${ok} files completed`);
    if (fixed) {
      log.warn(`${fixed} files fixed`);
    }
    log.flush(true);
  }
}

function checkDeclare(
  log,
  method,
  declared,
  toDeclare,
  ignoredDeclare,
  optionalDeclared = [],
  optionalToDeclare = []
) {
  let needToFix = false;
  const duplicated = getDuplicated(declared);
  if (duplicated.length > 0) {
    needToFix = true;
    log.error(`Duplicated ${method}:`);
    log.items(duplicated);
    log.info('');
  }
  const missing = difference(toDeclare, declared, optionalDeclared);
  if (missing.length > 0) {
    needToFix = true;
    log.error(`Missing ${method}:`);
    log.items(missing);
    log.info('');
  }
  let unnecessary = difference(declared, toDeclare, ignoredDeclare, optionalToDeclare);
  unnecessary = uniqArray(unnecessary);
  if (unnecessary.length > 0) {
    needToFix = true;
    log.error(`Unnecessary ${method}:`);
    log.items(unnecessary);
    log.info('');
  }
  return needToFix;
}

/**
 * @param {!Array<T>} array
 * @return {!Array<T>}
 * @template {T}
 */
function uniqArray(array) {
  return [...new Set(array)];
}

function memoize(func) {
  const cache = new Map();
  return (key, ...args) => {
    if (!cache.has(key)) {
      cache.set(key, func(key, ...args));
    }
    return cache.get(key);
  };
}

module.exports = main;
