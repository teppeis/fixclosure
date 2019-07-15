import * as parser from "@babel/parser";
import flat from "array.prototype.flat";
import doctrine from "doctrine";
import { traverse } from "estraverse-fb";
import difference from "lodash.difference";
import * as def from "./default";
import { leave, UsedNamespace } from "./visitor";

type Program = import("estree").Program;
type Comment = import("estree").Comment;
type SimpleCallExpression = import("estree").SimpleCallExpression;
type SimpleLiteral = import("estree").SimpleLiteral;

const tagsHavingType = new Set([
  "const",
  "define",
  "enum",
  "extends",
  "implements",
  "param",
  "return",
  "this",
  "type",
  "typedef",
]);

export type ParserOptions = any;
export interface FixClosureInfo {
  provided: string[];
  required: string[];
  requireTyped: string[];
  forwardDeclared: string[];
  toProvide: string[];
  toRequire: string[];
  toRequireType: string[];
  toForwardDeclare: string[];
  ignoredProvide: string[];
  ignoredRequire: string[];
  ignoredRequireType: string[];
  ignoredForwardDeclare: string[];
  provideStart: number;
  provideEnd: number;
}

export class Parser {
  options: any;
  private provideRoots_: Set<string>;
  private replaceMap_: Map<string, string>;
  private providedNamespaces_: Set<string>;
  private ignorePackages_: Set<string>;
  private min_ = Number.MAX_VALUE;
  private max_ = 0;

  constructor(opt_options?: ParserOptions) {
    const options = (this.options = opt_options || {});
    if (options.provideRoots) {
      this.provideRoots_ = new Set(options.provideRoots);
    } else {
      this.provideRoots_ = def.getRoots();
    }

    this.replaceMap_ = def.getReplaceMap();
    if (options.replaceMap) {
      options.replaceMap.forEach((value, key) => {
        this.replaceMap_.set(key, value);
      });
    }

    this.providedNamespaces_ = def.getProvidedNamespaces();
    if (options.providedNamespace) {
      options.providedNamespace.forEach(method => {
        this.providedNamespaces_.add(method);
      });
    }

    this.ignorePackages_ = def.getIgnorePackages();
  }

  parse(src: string): FixClosureInfo {
    const options = {
      comment: true,
      attachComment: true,
      loc: true,
      ecmaVersion: 2019,
      ecmaFeatures: {
        jsx: true,
      },
      plugins: ["estree", "jsx"],
      ...this.options.parserOptions,
    };
    const { program, comments } = parser.parse(src, options);
    // TODO: use espree instead of @babel/parser
    return this.parseAst(program as any, comments);
  }

  parseAst(program: Program, comments: Comment[]): FixClosureInfo {
    const parsed = this.traverseProgram_(program);
    const provided = this.extractProvided_(parsed);
    const required = this.extractRequired_(parsed);
    const requireTyped = this.extractRequireTyped_(parsed);
    const forwardDeclared = this.extractForwardDeclared_(parsed);
    const ignored = this.extractSuppressUnused_(parsed, comments);
    const toProvide = this.extractToProvide_(parsed, comments);
    const fromJsDoc = this.extractToRequireTypeFromJsDoc_(comments);
    const toRequire = this.extractToRequire_(parsed, toProvide, comments, fromJsDoc.toRequire);
    const toRequireType = difference(fromJsDoc.toRequireType, toProvide, toRequire);

    return {
      provided,
      required,
      requireTyped,
      forwardDeclared,
      toProvide,
      toRequire,
      toRequireType,
      toForwardDeclare: [] as string[],
      ignoredProvide: ignored.provide,
      ignoredRequire: ignored.require,
      ignoredRequireType: ignored.requireType,
      ignoredForwardDeclare: ignored.forwardDeclare,
      // first goog.provide or goog.require line
      provideStart: this.min_,
      // last goog.provide or goog.require line
      provideEnd: this.max_,
    };
  }

  private extractToProvide_(parsed: UsedNamespace[], comments: Comment[]): string[] {
    const suppressComments = this.getSuppressProvideComments_(comments);
    return parsed
      .filter(this.suppressFilter_.bind(this, suppressComments))
      .map(this.toProvideMapper_.bind(this))
      .filter(this.isDefAndNotNull_)
      .filter(this.provideRootFilter_.bind(this))
      .sort()
      .reduce(this.uniq_, []);
  }

  /**
   * @return comments that includes @typedef and not @private
   */
  private getTypedefComments_(comments: Comment[]): Comment[] {
    return comments.filter(comment => {
      if (isCommentBlock(comment) && /^\*/.test(comment.value)) {
        const jsdoc = doctrine.parse(`/* ${comment.value}*/`, { unwrap: true });
        return (
          jsdoc.tags.some(tag => tag.title === "typedef") &&
          !jsdoc.tags.some(tag => tag.title === "private")
        );
      }
      return false;
    });
  }

  private getSuppressProvideComments_(comments: Comment[]): Comment[] {
    return comments.filter(
      comment =>
        isCommentLine(comment) && /^\s*fixclosure\s*:\s*suppressProvide\b/.test(comment.value)
    );
  }

  private getSuppressRequireComments_(comments: Comment[]): Comment[] {
    return comments.filter(
      comment =>
        isCommentLine(comment) && /^\s*fixclosure\s*:\s*suppressRequire\b/.test(comment.value)
    );
  }

  private extractToRequire_(
    parsed: UsedNamespace[],
    toProvide: string[],
    comments: Comment[],
    opt_required?: string[]
  ): string[] {
    const additional = opt_required || [];
    const suppressComments = this.getSuppressRequireComments_(comments);
    const toRequire = parsed
      .filter(this.toRequireFilter_.bind(this))
      .filter(this.suppressFilter_.bind(this, suppressComments))
      .map(this.toRequireMapper_.bind(this))
      .concat(additional)
      .filter(this.isDefAndNotNull_)
      .sort()
      .reduce(this.uniq_, []);
    return difference(toRequire, toProvide);
  }

  private extractToRequireTypeFromJsDoc_(
    comments: Comment[]
  ): { toRequire: string[]; toRequireType: string[] } {
    const toRequire: string[] = [];
    const toRequireType: string[] = [];
    comments
      .filter(
        comment =>
          // JSDoc Style
          isCommentBlock(comment) && /^\*/.test(comment.value)
      )
      .forEach(comment => {
        const { tags } = doctrine.parse(`/* ${comment.value}*/`, { unwrap: true });
        tags
          .filter(tag => tagsHavingType.has(tag.title) && tag.type)
          .map(tag => this.extractType(tag.type!))
          .forEach(names => {
            toRequireType.push(...names);
          });
        tags
          .filter(tag => tag.title === "implements" && tag.type)
          .map(tag => this.extractType(tag.type!))
          .forEach(names => {
            toRequire.push(...names);
          });
      });
    return {
      toRequire: toRequire
        .filter(name => this.isProvidedNamespace_(name))
        .sort()
        .reduce(this.uniq_, []),
      toRequireType: toRequireType
        .filter(name => this.isProvidedNamespace_(name))
        .sort()
        .reduce(this.uniq_, []),
    };
  }

  extractType(type: doctrine.Type | null): string[] {
    if (!type) {
      return [];
    }
    let result: string[];
    switch (type.type) {
      case "NameExpression":
        return [type.name];
      case "NullableType":
      case "NonNullableType":
      case "OptionalType":
      case "RestType":
        return this.extractType(type.expression);
      case "TypeApplication":
        result = this.extractType(type.expression);
        result.push(...flat<string>(type.applications.map(app => this.extractType(app))));
        break;
      case "UnionType":
        return flat<string>(type.elements.map(el => this.extractType(el)));
      case "RecordType":
        return flat<string>(type.fields.map(field => this.extractType(field)));
      case "FieldType":
        if (type.value) {
          return this.extractType(type.value);
        } else {
          return [];
        }
      case "FunctionType":
        result = flat<string>(type.params.map(param => this.extractType(param)));
        if (type.result) {
          result.push(...this.extractType(type.result));
        }
        if (type.this) {
          result.push(...this.extractType(type.this));
        }
        break;
      default:
        result = [];
    }
    return result;
  }

  /**
   * Extract "goog.require('goog.foo') // fixclosure: ignore".
   * "suppressUnused" is deprecated.
   */
  private extractSuppressUnused_(parsed: UsedNamespace[], comments: Comment[]) {
    const suppresses = comments
      .filter(
        comment =>
          isCommentLine(comment) &&
          comment.loc.start.line >= this.min_ &&
          comment.loc.start.line <= this.max_ &&
          /^\s*fixclosure\s*:\s*(?:suppressUnused|ignore)\b/.test(comment.value)
      )
      .reduce(
        (prev, item) => {
          prev[item.loc.start.line] = true;
          return prev;
        },
        // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
        {} as { [index: number]: boolean }
      );

    if (Object.keys(suppresses).length === 0) {
      return { provide: [], require: [], requireType: [], forwardDeclare: [] };
    }

    const getSuppressedNamespaces = method =>
      parsed
        .filter(this.callExpFilter_.bind(this, method))
        .filter(req => !!suppresses[req.node.loc.start.line])
        .map(this.callExpMapper_)
        .filter(this.isDefAndNotNull_)
        .sort();

    return {
      provide: getSuppressedNamespaces("goog.provide"),
      require: getSuppressedNamespaces("goog.require"),
      requireType: getSuppressedNamespaces("goog.requireType"),
      forwardDeclare: getSuppressedNamespaces("goog.forwardDeclare"),
    };
  }

  private uniq_(prev: string[], cur: string): string[] {
    if (prev[prev.length - 1] !== cur) {
      prev.push(cur);
    }
    return prev;
  }

  private extractProvided_(parsed: UsedNamespace[]): string[] {
    return this.extractGoogDeclaration_(parsed, "goog.provide");
  }

  private extractRequired_(parsed: UsedNamespace[]): string[] {
    return this.extractGoogDeclaration_(parsed, "goog.require");
  }

  private extractRequireTyped_(parsed: UsedNamespace[]): string[] {
    return this.extractGoogDeclaration_(parsed, "goog.requireType");
  }

  private extractForwardDeclared_(parsed: UsedNamespace[]): string[] {
    return this.extractGoogDeclaration_(parsed, "goog.forwardDeclare");
  }

  /**
   * @param parsed
   * @param method like 'goog.provide' or 'goog.require'
   */
  private extractGoogDeclaration_(parsed: UsedNamespace[], method: string): string[] {
    return parsed
      .filter(this.callExpFilter_.bind(this, method))
      .map(this.callExpMapper_)
      .filter(this.isDefAndNotNull_)
      .sort();
  }

  private traverseProgram_(node: Program): UsedNamespace[] {
    const uses: UsedNamespace[] = [];
    traverse(node, {
      leave(currentNode, parent) {
        leave.call(this, currentNode, parent, uses);
      },
    });
    return uses;
  }

  private isDefAndNotNull_<T>(item: T): item is Required<T> {
    return item != null;
  }

  /**
   * @return True if the item has a root namespace to extract.
   */
  private provideRootFilter_(item: string): boolean {
    const root = item.split(".")[0];
    return this.provideRoots_.has(root);
  }

  /**
   * @return Provided namespace
   */
  private toProvideMapper_(use: UsedNamespace): string | null {
    const name = use.name.join(".");
    let typeDefComments;
    switch (use.node.type) {
      case "AssignmentExpression":
        if (use.key === "left" && use.node.loc.start.column === 0) {
          return this.getProvidedPackageName_(name);
        }
        break;
      case "ExpressionStatement":
        if (!use.node.leadingComments) {
          return null;
        }
        typeDefComments = this.getTypedefComments_(use.node.leadingComments);
        if (typeDefComments.length > 0) {
          return this.getProvidedPackageName_(name);
        }
        break;

      default:
        break;
    }
    return null;
  }

  /**
   * @return Required namespace
   */
  private toRequireMapper_(use: UsedNamespace): string | null {
    const name = use.name.join(".");
    return this.getRequiredPackageName_(name);
  }

  private toRequireFilter_(use: UsedNamespace): boolean {
    switch (use.node.type) {
      case "ExpressionStatement":
        return false;

      case "AssignmentExpression":
        if (use.key === "left" && use.node.loc.start.column === 0) {
          return false;
        }
        break;
      case "VariableDeclarator":
        if (use.key === "id") {
          return false;
        }
        break;

      default:
        break;
    }

    return true;
  }

  /**
   * Filter toProvide and toRequire if it is suppressed.
   */
  private suppressFilter_(comments: Comment[], use: UsedNamespace): boolean {
    const start = use.node.loc.start.line;
    const suppressComment = comments.some(comment => comment.loc.start.line + 1 === start);
    return !suppressComment;
  }

  private getRequiredPackageName_(name: string): string | null {
    let names = name.split(".");
    do {
      const name = this.replaceMethod_(names.join("."));
      if (this.providedNamespaces_.has(name) && !this.isIgnorePackage_(name)) {
        return name;
      }
      names = names.slice(0, -1);
    } while (names.length > 0);
    return null;
  }

  private getProvidedPackageName_(name: string): string | null {
    name = this.replaceMethod_(name);
    let names = name.split(".");
    let lastname = names[names.length - 1];
    // Remove prototype or superClass_.
    names = names.reduceRight(
      (prev, cur) => {
        if (cur === "prototype") {
          return [];
        } else {
          prev.unshift(cur);
          return prev;
        }
      },
      [] as string[]
    );

    if (!this.isProvidedNamespace_(name)) {
      lastname = names[names.length - 1];
      if (/^[a-z$]/.test(lastname)) {
        // Remove the last method name.
        names.pop();
      }

      while (names.length > 0) {
        lastname = names[names.length - 1];
        if (/^[A-Z][_0-9A-Z]+$/.test(lastname)) {
          // Remove the last constant name.
          names.pop();
        } else {
          break;
        }
      }
    }

    if (this.isPrivateProp_(names)) {
      return null;
    }

    const pkg = names.join(".");
    if (pkg && !this.isIgnorePackage_(pkg)) {
      return this.replaceMethod_(pkg);
    } else {
      // Ignore just one word namespace like 'goog'.
      return null;
    }
  }

  private isIgnorePackage_(name: string): boolean {
    return this.ignorePackages_.has(name);
  }

  private isPrivateProp_(names: string[]): boolean {
    return names.some(name => name.endsWith("_"));
  }

  private replaceMethod_(method: string): string {
    return this.replaceMap_.has(method) ? this.replaceMap_.get(method) : method;
  }

  private isProvidedNamespace_(name: string): boolean {
    return this.providedNamespaces_.has(name);
  }

  private callExpFilter_(method: string, use: UsedNamespace): boolean {
    const name = use.name.join(".");
    switch (use.node.type) {
      case "CallExpression":
        if (method === name) {
          const start = use.node.loc.start.line;
          const end = use.node.loc.end.line;
          this.min_ = Math.min(this.min_, start);
          this.max_ = Math.max(this.max_, end);
          return true;
        }
        break;
      default:
        break;
    }
    return false;
  }

  callExpMapper_(use: UsedNamespace): string {
    return ((use.node as SimpleCallExpression).arguments[0] as SimpleLiteral).value as string;
  }
}

/**
 * Support both ESTree (Line) and @babel/parser (CommentLine)
 */
function isCommentLine(comment): boolean {
  return comment.type === "CommentLine" || comment.type === "Line";
}

/**
 * Support both ESTree (Block) and @babel/parser (CommentBlock)
 * @param {Object} comment
 * @return {boolean}
 */
function isCommentBlock(comment): boolean {
  return comment.type === "CommentBlock" || comment.type === "Block";
}
