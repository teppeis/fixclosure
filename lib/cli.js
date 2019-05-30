'use strict';

const fs = require('fs');
const path = require('path');
const clc = require('cli-color');
const commander = require('commander');
const _ = require('underscore');
const fix = require('./fix');
const Parser = require('./parser');
const Logger = require('./clilogger');
const pkg = require('../package.json');

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
    .option('--config <file>', '.fixclosurerc file path.')
    .option('--showSuccess', 'Show success ouput.', false)
    .option('--no-color', 'Disable color highlight.');
}

function getDuplicated(namespaces) {
  const dups = [];
  namespaces.reduce((prev, cur) => {
    if (prev === cur) {
      dups.push(cur);
    }
    return cur;
  }, null);
  return dups;
}

/**
 * Find .fixclosurerc up from current working dir
 * @return {string|null}
 */
function findConfig() {
  return findConfig_(process.cwd());
}

const findConfig_ = _.memoize(dir => {
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
 */
function main(argv, stdout, stderr, exit) {
  argv = loadConfig(argv);

  const program = new commander.Command();
  setCommandOptions(program).parse(argv);

  if (program.args.length < 1) {
    program.outputHelp();
    exit(1);
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
      namespaceMethods: program.namespaceMethods,
      replaceMap: program.replaceMap,
    };
    const parser = new Parser(options);
    const info = parser.parse(src);
    log.info('Provided:');
    log.items(
      info.provided.map(item => {
        return item + (_.contains(info.ignoredProvide, item) ? ' (ignored)' : '');
      })
    );
    log.info('');
    log.info('Required:');
    log.items(
      info.required.map(item => {
        return item + (_.contains(info.ignoredRequire, item) ? ' (ignored)' : '');
      })
    );
    log.info('');

    let needToFix = false;

    const dupProvide = getDuplicated(info.provided);
    if (dupProvide.length > 0) {
      needToFix = true;
      log.error('Duplicated Provide:');
      log.items(_.uniq(dupProvide));
      log.info('');
    }

    const missingProvide = _.difference(info.toProvide, info.provided);
    if (missingProvide.length > 0) {
      needToFix = true;
      log.error('Missing Provide:');
      log.items(missingProvide);
      log.info('');
    }

    let unnecessaryProvide = _.difference(info.provided, info.toProvide);
    unnecessaryProvide = _.difference(unnecessaryProvide, info.ignoredProvide);
    if (unnecessaryProvide.length > 0) {
      needToFix = true;
      log.error('Unnecessary Provide:');
      log.items(unnecessaryProvide);
      log.info('');
    }

    const dupRequire = getDuplicated(info.required);
    if (dupRequire.length > 0) {
      needToFix = true;
      log.error('Duplicated Require:');
      log.items(_.uniq(dupRequire));
      log.info('');
    }

    const missingRequire = _.difference(info.toRequire, info.required);
    if (missingRequire.length > 0) {
      needToFix = true;
      log.error('Missing Require:');
      log.items(missingRequire);
      log.info('');
    }

    let unnecessaryRequire = _.difference(info.required, info.toRequire);
    unnecessaryRequire = _.difference(unnecessaryRequire, info.ignoredRequire);
    if (unnecessaryRequire.length > 0) {
      needToFix = true;
      log.error('Unnecessary Require:');
      log.items(unnecessaryRequire);
      log.info('');
    }

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

module.exports = main;
