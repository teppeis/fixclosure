import clc from "cli-color";
import { Writable } from "stream";

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

  raw(msg: string, opt_color?: clc.Format) {
    this.messages_.push(this.color_ && opt_color ? opt_color(msg) : msg);
  }

  info(msg: string) {
    this.raw(msg);
  }

  warn(msg: string) {
    this.raw(msg, clc.yellow);
  }

  error(msg: string) {
    this.raw(msg, clc.red);
  }

  success(msg: string) {
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
   * @param success If true, flush to stdout. Otherwise to stderr.
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
