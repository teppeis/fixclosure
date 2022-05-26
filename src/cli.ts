import clc from "cli-color";
import commander from "commander";
import fs from "fs";
import { parser as depsJsParser } from "google-closure-deps";
import difference from "lodash.difference";
import path from "path";
import { promisify } from "util";
import type { LogOutput } from "./clilogger";
import Logger from "./clilogger";
import { fixInPlace } from "./fix";
import { Parser } from "./parser";

// Dont't use `import from` to avoid creating nested directory `./lib/src`.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../package.json");

function list(val: string): string[] {
  return val.split(",");
}

function map(val: string): Map<string, string> {
  const mapping = new Map<string, string>();
  val.split(",").forEach((item) => {
    const [key, value] = item.split(":");
    mapping.set(key, value);
  });
  return mapping;
}

function setCommandOptions(command: commander.Command) {
  return command
    .version(version, "-v, --version")
    .usage("[options] files...")
    .option("-f, --fix-in-place", "Fix the file in-place.")
    .option(
      "--provideRoots <roots>",
      "Root namespaces to provide separated by comma.",
      list
    )
    .option("--ignoreProvides", "Provides will remain unchanged")
    .option(
      "--namespaces <methods>",
      "Provided namespaces separated by comma.",
      list
    )
    .option(
      "--replaceMap <map>",
      'Methods or properties to namespaces mapping like "before1:after1,before2:after2".',
      map
    )
    .option(
      "--useForwardDeclare",
      "Use goog.forwardDeclare() instead of goog.requireType()."
    )
    .option("--config <file>", ".fixclosurerc file path.")
    .option("--depsJs <files>", "deps.js file paths separated by comma.", list)
    .option("--showSuccess", "Show success ouput.")
    .option("--no-color", "Disable color highlight.");
}

function getDuplicated(namespaces: string[]): string[] {
  const dups = new Set<string>();
  namespaces.reduce((prev: string | null, cur) => {
    if (prev === cur) {
      dups.add(cur);
    }
    return cur;
  }, null);
  return [...dups];
}

/**
 * Find .fixclosurerc up from current working dir
 */
function findConfig(opt_dir?: string): string | null {
  return findConfig_(opt_dir || process.cwd());
}

const findConfig_: (dir: string) => string | null = memoize<
  string,
  string | null
>((dir) => {
  const filename = ".fixclosurerc";
  const filepath = path.normalize(path.join(dir, filename));
  try {
    fs.accessSync(filepath);
    return filepath;
  } catch {
    // ignore
  }

  const parent = path.resolve(dir, "../");
  if (dir === parent) {
    return null;
  }

  return findConfig_(parent);
});

function parseArgs(
  argv: string[],
  opt_dir?: string
): { opts: commander.OptionValues; program: commander.Command } {
  const program = new commander.Command();
  const opts = setCommandOptions(program).parse(argv).opts();
  if (Array.isArray(opts.depsJs) && opts.depsJs.length > 0) {
    const results = opts.depsJs.map((file) =>
      depsJsParser.parseFile(path.resolve(opt_dir || process.cwd(), file))
    );
    const symbols = results
      .map((result) => result.dependencies.map((dep) => dep.closureSymbols))
      .flat(2);
    opts.depsJsSymbols = symbols;
  }
  return { opts, program };
}

interface ResolveConfigOptions {
  config?: string;
  cwd?: string;
}

export function resolveConfig({ config, cwd }: ResolveConfigOptions = {}): {
  opts: commander.OptionValues;
  program: commander.Command;
} | null {
  const configPath = config || findConfig(cwd);
  if (!configPath) {
    return null;
  }
  const opts = fs.readFileSync(configPath, "utf8").trim().split(/\s+/);
  const argv = ["node", "fixclosure", ...opts];
  return parseArgs(argv, path.dirname(configPath));
}

async function getFiles(args: string[]): Promise<string[]> {
  const { globby } = await import("globby");
  return globby(args, {
    expandDirectories: { files: ["*"], extensions: ["js"] },
  });
}

async function main(
  argv: string[],
  stdout: LogOutput,
  stderr: LogOutput,
  exit: (exitCode: number) => void
): Promise<void> {
  const { opts: argsOptions, program } = parseArgs(argv);
  const { opts: rcOptions } =
    resolveConfig({ config: argsOptions.config }) ?? {};
  const options: any = { ...rcOptions, ...argsOptions };

  if (program.args.length < 1) {
    program.outputHelp();
    exit(1);
  }

  // for Parser
  options.providedNamespace = (options.depsJsSymbols || []).concat(
    options.namespaces || []
  );

  let ok = 0;
  let ng = 0;
  let fixed = 0;

  const files = await getFiles(program.args);
  const promises = files.map(async (file: string) => {
    const log = new Logger(options.color, stdout, stderr);
    log.warn(`File: ${file}\n`);
    const src = await promisify(fs.readFile)(file, "utf8");
    const parser = new Parser(options);
    const info = parser.parse(src);

    if (options.useForwardDeclare) {
      info.toForwardDeclare = info.toRequireType;
      info.toRequireType = [];
    }
    log.info("Provided:");
    log.items(
      info.provided.map(
        (item) =>
          item + (info.ignoredProvide.includes(item) ? " (ignored)" : "")
      )
    );
    log.info("");
    log.info("Required:");
    log.items(
      info.required.map(
        (item) =>
          item + (info.ignoredRequire.includes(item) ? " (ignored)" : "")
      )
    );
    log.info("");
    if (info.requireTyped.length > 0) {
      log.info("RequireTyped:");
      log.items(
        info.requireTyped.map(
          (item) =>
            item + (info.ignoredRequireType.includes(item) ? " (ignored)" : "")
        )
      );
      log.info("");
    }
    if (info.forwardDeclared.length > 0) {
      log.info("ForwardDeclared:");
      log.items(
        info.forwardDeclared.map(
          (item) =>
            item +
            (info.ignoredForwardDeclare.includes(item) ? " (ignored)" : "")
        )
      );
      log.info("");
    }

    let needToFix = false;
    needToFix =
      checkDeclare(
        log,
        "Provide",
        info.provided,
        info.toProvide,
        info.ignoredProvide
      ) || needToFix;
    needToFix =
      checkDeclare(
        log,
        "Require",
        info.required,
        info.toRequire,
        info.ignoredRequire
      ) || needToFix;
    needToFix =
      checkDeclare(
        log,
        "RequireType",
        info.requireTyped,
        info.toRequireType,
        info.ignoredRequireType,
        info.forwardDeclared,
        info.toForwardDeclare
      ) || needToFix;
    needToFix =
      checkDeclare(
        log,
        "ForwardDeclare",
        info.forwardDeclared,
        info.toForwardDeclare,
        info.ignoredForwardDeclare,
        info.requireTyped,
        info.toRequireType
      ) || needToFix;

    if (needToFix) {
      if (options.fixInPlace) {
        await fixInPlace(file, src, info);
        log.raw("FIXED!", clc.cyan);
        fixed++;
      } else {
        log.error("FAIL!");
        ng++;
      }
      log.flush(false);
    } else {
      ok++;
      log.success("GREEN!");
      if (options.showSuccess) {
        log.flush(true);
      }
    }
  });

  let hasException = false;
  try {
    await Promise.all(promises);
  } catch (e) {
    console.error(e);
    hasException = true;
  }

  const log = new Logger(options.color, stdout, stderr);
  const total = files.length;
  log.info("");
  log.info(`Total: ${total} files`);
  log.success(`Passed: ${ok} files`);
  if (ng) {
    log.error(`Failed: ${ng} files`);
  }
  if (fixed) {
    log.warn(`Fixed: ${fixed} files`);
  }
  if (ng || hasException) {
    log.flush(false);
    exit(1);
  } else {
    log.flush(true);
  }
}

function checkDeclare(
  log: Logger,
  method: string,
  declared: string[],
  toDeclare: string[],
  ignoredDeclare: string[],
  optionalDeclared: string[] = [],
  optionalToDeclare: string[] = []
): boolean {
  let needToFix = false;
  const duplicated = getDuplicated(declared);
  if (duplicated.length > 0) {
    needToFix = true;
    log.error(`Duplicated ${method}:`);
    log.items(duplicated);
    log.info("");
  }
  const missing = difference(toDeclare, declared, optionalDeclared);
  if (missing.length > 0) {
    needToFix = true;
    log.error(`Missing ${method}:`);
    log.items(missing);
    log.info("");
  }
  let unnecessary = difference(
    declared,
    toDeclare,
    ignoredDeclare,
    optionalToDeclare
  );
  unnecessary = uniqArray(unnecessary);
  if (unnecessary.length > 0) {
    needToFix = true;
    log.error(`Unnecessary ${method}:`);
    log.items(unnecessary);
    log.info("");
  }
  return needToFix;
}

function uniqArray<T>(array: T[]): T[] {
  return [...new Set(array)];
}

function memoize<K, V>(func: (key: K, ...args: any[]) => V) {
  const cache = new Map<K, V>();
  return (key: K, ...args: any[]) => {
    if (!cache.has(key)) {
      cache.set(key, func(key, ...args));
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return cache.get(key)!;
  };
}

export { main as cli };
