'use strict';

let clc = require('cli-color');

/**
 * @param {boolean} enableColor
 * @param {stream.Writable} stdout
 * @param {stream.Readable} stderr
 * @constructor
 * @this {Logger}
 */
let Logger = function(enableColor, stdout, stderr) {
  this.color_ = !!enableColor;
  this.messages_ = [];
  this.stdout = stdout;
  this.stderr = stderr;
};

/**
 * @param {string} msg
 * @param {function(string)=} opt_color
 */
Logger.prototype.raw = function(msg, opt_color) {
  this.messages_.push(this.color_ && opt_color ? opt_color(msg) : msg);
};

/**
 * @param {string} msg
 */
Logger.prototype.info = function(msg) {
  this.raw(msg);
};

/**
 * @param {string} msg
 */
Logger.prototype.warn = function(msg) {
  this.raw(msg, clc.yellow);
};

/**
 * @param {string} msg
 */
Logger.prototype.error = function(msg) {
  this.raw(msg, clc.red);
};

/**
 * @param {string} msg
 */
Logger.prototype.success = function(msg) {
  this.raw(msg, clc.green);
};

/**
 * Log items with black bright.
 * @param {Array<string>} items
 */
Logger.prototype.items = function(items) {
  if (items.length === 0) {
    items = ['(none)'];
  }
  this.messages_ = this.messages_.concat(items.map(function(item) {
    item = '- ' + item;
    return this.color_ ? clc.blackBright(item) : item;
  }, this));
};

/**
 * Flush out all stored messages.
 * @param {boolean} success If true, flush to stdout. Otherwise to stderr.
 */
Logger.prototype.flush = function(success) {
  let out = success ? this.stdout : this.stderr;
  this.messages_.forEach(function(msg) {
    out.write(msg + '\n');
  });
  this.empty();
};

/**
 * Clear all stored messages.
 */
Logger.prototype.empty = function() {
  this.messages_ = [];
};

module.exports = Logger;
