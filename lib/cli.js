'use strict';

var clc = require('cli-color');
var commander = require('commander');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var fix = require('./fix');
var Parser = require('./parser');

var Logger = function(enableColor, stdout, stderr) {
  this.color_ = !!enableColor;
  this.messages_ = [];
  this.stdout = stdout;
  this.stderr = stderr;
};

Logger.prototype.raw = function(msg) {
  this.messages_.push(msg);
};

Logger.prototype.info = function(msg) {
  this.messages_.push(msg);
};

Logger.prototype.warn = function(msg) {
  this.messages_.push(this.color_ ? clc.yellow(msg) : msg);
};

Logger.prototype.error = function(msg) {
  this.messages_.push(this.color_ ? clc.red(msg) : msg);
};

Logger.prototype.success = function(msg) {
  this.messages_.push(this.color_ ? clc.green(msg) : msg);
};

Logger.prototype.items = function(items) {
  if (items.length === 0) {
    items = ['(none)'];
  }
  this.messages_ = this.messages_.concat(items.map(function(item) {
    item = '- ' + item;
    return this.color_ ? clc.blackBright(item) : item;
  }, this));
};

Logger.prototype.flush = function(success) {
  var out = success ? this.stdout: this.stderr;
  this.messages_.forEach(function(msg) {
    out.write(msg + '\n');
  });
  this.empty();
};

Logger.prototype.empty = function() {
  this.messages_ = [];
};

function list(val) {
  return val.split(',');
}

function map(val) {
  var mapping = {};
  val.split(',').forEach(function(item) {
    var entry = item.split(':');
    mapping[entry[0]] = entry[1];
  });
  return mapping;
}

function setCommandOptions(command) {
  return command
    .version(require('../package.json').version, '-v, --version')
    .usage('[options] files...')
    .option('-f, --fix-in-place', 'Fix the file in-place.')
    .option('--roots <roots>', 'Additional root namespaces to provide or require separated by comma.', list)
    .option('--namespaceMethods <methods>', 'Methods or properties which are also namespaces separated by comma.', list)
    .option('--replaceMap <map>', 'Methods or properties to namespaces mapping like "before1:after1,before2:after2".', map)
    .option('--config <file>', '.fixclosurerc file path.')
    .option('--showSuccess', 'Show success ouput.', false)
    .option('--no-color', 'Disable color highlight.');
}

function getDuplicated(namespaces) {
  var dups = [];
  namespaces.reduce(function(prev, cur) {
    if (prev === cur) {
      dups.push(cur);
    }
    return cur;
  }, null);
  return dups;
}

/**
 * Find .fixclosurerc up from current working dir
 */
function findConfig() {
  return findConfig_(process.cwd());
}

var findConfig_ = _.memoize(function(dir) {
  var name = '.fixclosurerc';

  var filename = path.normalize(path.join(dir, name));
  if (fs.existsSync(filename)) {
    return filename;
  }

  var parent = path.resolve(dir, '../');
  if (dir === parent) {
    return null;
  }

  return findConfig_(parent);
});

/**
 * Load .fixclosurerc to argv
 * @param {Array} argv
 */
function loadConfig(argv) {
  var command = setCommandOptions(new commander.Command());
  command.parse(argv);
  var configPath = command.config || findConfig();
  if (configPath) {
    var opts = fs.readFileSync(configPath, 'utf8').trim().split(/\s+/);
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

  var program = new commander.Command();
  setCommandOptions(program).parse(argv);

  if (program.args.length < 1) {
    program.outputHelp();
    exit(1);
  }

  var ok = 0;
  var ng = 0;
  var fixed = 0;
  var log = new Logger(program.color, stdout, stderr);

  program.args.forEach(function(file) {
    log.warn('File: ' + file + '\n');
    var src = fs.readFileSync(file, 'utf8');
    var options = {
      roots: program.roots,
      namespaceMethods: program.namespaceMethods,
      replaceMap: program.replaceMap
    };
    var parser = new Parser(options);
    var info = parser.parse(src);
    log.info('Provided:');
    log.items(info.provided);
    log.info('');
    log.info('Required:');
    log.items(info.required);
    log.info('');

    var needToFix = false;

    var dupProvide = getDuplicated(info.provided);
    if (dupProvide.length > 0) {
      needToFix = true;
      log.error('Duplicated Provide:');
      log.items(_.uniq(dupProvide));
      log.info('');
    }

    var missingProvide = _.difference(info.toProvide, info.provided);
    if (missingProvide.length > 0) {
      needToFix = true;
      log.error('Missing Provide:');
      log.items(missingProvide);
      log.info('');
    }

    var unnecessaryProvide = _.difference(info.provided, info.toProvide);
    if (unnecessaryProvide.length > 0) {
      needToFix = true;
      log.error('Unnecessary Provide:');
      log.items(unnecessaryProvide);
      log.info('');
    }

    var dupRequire = getDuplicated(info.required);
    if (dupRequire.length > 0) {
      needToFix = true;
      log.error('Duplicated Require:');
      log.items(_.uniq(dupRequire));
      log.info('');
    }

    var missingRequire = _.difference(info.toRequire, info.required);
    if (missingRequire.length > 0) {
      needToFix = true;
      log.error('Missing Require:');
      log.items(missingRequire);
      log.info('');
    }

    var unnecessaryRequire = _.difference(info.required, info.toRequire);
    unnecessaryRequire = _.difference(unnecessaryRequire, info.suppressed);
    if (unnecessaryRequire.length > 0) {
      needToFix = true;
      log.error('Unnecessary Require:');
      log.items(unnecessaryRequire);
      log.info('');
    }

    if (info.suppressed.length) {
      log.info('Unnecessary Require (Suppressed):');
      log.items(info.suppressed);
      log.info('');
    }

    if (needToFix) {
      if (program.fixInPlace) {
        fix(file, info);
        log.raw(clc.cyanBright('FIXED!'));
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

  var total = ok + ng + fixed;
  log.raw('');
  if (ng) {
    log.error(ng + ' of ' + total + ' files failed');
    if (fixed) {
      log.warn(fixed + ' files fixed');
    }
    log.flush(false);
    exit(1);
  } else {
    log.success(ok + ' files completed');
    if (fixed) {
      log.warn(fixed + ' files fixed');
    }
    log.flush(true);
  }
}

module.exports = main;
