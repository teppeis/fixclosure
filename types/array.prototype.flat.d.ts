/**
 * Types for array.prototype.flat
 * @see https://github.com/es-shims/Array.prototype.flat
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
 */
declare function flat<T>(array: T[] | T[][] | T[][][] | T[][][][], depth?: number): T[];
export = flat;
