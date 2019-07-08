import clc from "cli-color";
import { Writable } from "stream";

/**
 * @param {boolean} enableColor
 * @param {stream.Writable} stdout
 * @param {stream.Readable} stderr
 * @constructor
 */
class Logger {
  private color_: boolean;
  private messages_: string[];
  stdout: Writable;
  stderr: Writable;
  constructor(enableColor: boolean, stdout: Writable, stderr: Writable) {
    this.color_ = !!enableColor;
    this.messages_ = [];
    this.stdout = stdout;
    this.stderr = stderr;
  }

  /**
   * @param {string} msg
   * @param {function(string)=} opt_color
   */
  raw(msg: string, opt_color?: (msg: string) => string) {
    this.messages_.push(this.color_ && opt_color ? opt_color(msg) : msg);
  }

  /**
   * @param {string} msg
   */
  info(msg) {
    this.raw(msg);
  }

  /**
   * @param {string} msg
   */
  warn(msg) {
    this.raw(msg, clc.yellow);
  }

  /**
   * @param {string} msg
   */
  error(msg) {
    this.raw(msg, clc.red);
  }

  /**
   * @param {string} msg
   */
  success(msg) {
    this.raw(msg, clc.green);
  }

  /**
   * Log items with black bright.
   */
  items(items: string[]) {
    if (items.length === 0) {
      items = ["(none)"];
    }
    this.messages_ = this.messages_.concat(
      items.map(item => {
        item = `- ${item}`;
        return this.color_ ? clc.blackBright(item) : item;
      }, this)
    );
  }

  /**
   * Flush out all stored messages.
   * @param {boolean} success If true, flush to stdout. Otherwise to stderr.
   */
  flush(success: boolean) {
    const out = success ? this.stdout : this.stderr;
    this.messages_.forEach(msg => {
      out.write(`${msg}\n`);
    });
    this.empty();
  }

  /**
   * Clear all stored messages.
   */
  empty() {
    this.messages_ = [];
  }
}

export default Logger;
