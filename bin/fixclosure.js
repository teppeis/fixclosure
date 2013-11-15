#!/usr/bin/env node

var clc = require('cli-color');
var program = require('commander');
var fs = require('fs');
var _ = require('underscore');
var fixclosure = require('../');
var Parser = fixclosure.Parser;

var Logger = function(enableColor) {
  this.color_ = !!enableColor;
  this.messages_ = [];
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
  if (items.length === 0) items = ['(none)'];
  this.messages_ = this.messages_.concat(items.map(function(item) {
    item = '- ' + item;
    return this.color_ ? clc.blackBright(item) : item;
  }, this));
};

Logger.prototype.flush = function(success) {
  var method = success ? console.log : console.error;
  this.messages_.forEach(function(msg) {
    method(msg);
  });
};

function list(val) {
  return val.split(',');
}

function map(val) {
  var map = {};
  val.split(',').forEach(function(item) {
    var entry = item.split(':');
    map[entry[0]] = entry[1];
  });
  return map;
}

function setCommandOptions(command) {
  return command
    .version(require('../package.json').version, '-v, --version')
    .usage('[options] files...')
    .option('-f, --fix-in-place', 'Fix the file in-place.')
    .option('--roots <roots>', 'Root of target package to provide and require separated by comma. Dafault: "goog"', list)
    .option('--packageMethods <methods>', 'Method exprted as a package itself. Comma separated list.', list)
    .option('--replaceMap <map>', 'Method replace map. Like "before1:after1,before2:after2"', map)
    .option('--config <file>', 'Specify .fixclosurerc file', '.fixclosurerc')
    .option('--no-color', 'Highlight the output.');
}

// Load .fixclosurerc
try {
  var command = setCommandOptions(new program.Command());
  command.parse(process.argv);
  var opts = fs.readFileSync(command.config, 'utf8').trim().split(/\s+/);
  process.argv = process.argv.slice(0, 2).concat(opts.concat(process.argv.slice(2)));
} catch (err) {
  // ignore
}

setCommandOptions(program).parse(process.argv);

if (program.args.length < 1) {
  program.outputHelp();
  process.exit(1);
}

var failed = false;

program.args.forEach(function(file) {
  var log = new Logger(program.color);
  log.warn('File: ' + file + '\n');
  var src = fs.readFileSync(file, 'utf-8');
  var options = {
    roots: program.roots,
    packageMethods: program.packageMethods,
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

  var unnecessaryProvide = _.difference(info.provide, info.toProvide);
  if (unnecessaryProvide.length > 0) {
    needToFix = true;
    log.error('Not Provided Actually:');
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
  if (unnecessaryRequire.length > 0) {
    needToFix = true;
    log.error('Not Required Actually:');
    log.items(unnecessaryRequire);
    log.info('');
  }

  if (needToFix) {
    log.error('FAIL!');
    if (program.fixInPlace) {
        fixclosure.fix(file, info);
        log.raw(clc.cyanBright('Fixed!'));
    } else {
        failed = true;
    }
    log.flush(false);
  } else {
    log.success('GREEN!');
    log.flush(true);
  }
});

if (failed) {
  process.exit(1);
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
