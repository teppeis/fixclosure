import fs from "fs";
import { promisify } from "util";
import { FixClosureInfo } from "./parser";

export function fixInPlace(file: string, src: string, info: FixClosureInfo): Promise<void> {
  const fixedSrc = getFixedSource(src, info);
  return promisify(fs.writeFile)(file, fixedSrc, "utf8");
}

export function getFixedSource(src: string, info: FixClosureInfo): string {
  const buf: string[] = [];
  let bodyStarted = false;
  if (info.provideEnd === 0) {
    writeDeclarationHeader(buf, info);
    buf.push(src);
  } else {
    src.split("\n").forEach((line, index) => {
      const lineNum = index + 1;
      if (lineNum < info.provideStart) {
        buf.push(line);
      } else if (lineNum === info.provideStart) {
        writeDeclarationHeader(buf, info);
      } else if (lineNum <= info.provideEnd) {
        // skip
      } else if (bodyStarted || line) {
        bodyStarted = true;
        buf.push(line);
      }
    });
  }
  return buf.join("\n");
}

function writeDeclarationHeader(buf: string[], info: FixClosureInfo): void {
  const provides = getProvideSrc(info);
  const requires = getRequireSrc(info);
  const requireTypes = getRequireTypeSrc(info);
  const forwardDeclares = getForwardDeclareSrc(info);

  if (provides.length > 0) {
    buf.push(...provides);
    buf.push("");
  }
  if (requires.length > 0) {
    buf.push(...requires);
    buf.push("");
  }
  if (requireTypes.length > 0) {
    buf.push(...requireTypes);
    buf.push("");
  }
  if (forwardDeclares.length > 0) {
    buf.push(...forwardDeclares);
    buf.push("");
  }
}

function getProvideSrc(info: FixClosureInfo): string[] {
  return getDeclarationSrc(info.toProvide, info.ignoredProvide, "goog.provide");
}

function getRequireSrc(info: FixClosureInfo): string[] {
  return getDeclarationSrc(info.toRequire, info.ignoredRequire, "goog.require");
}

function getRequireTypeSrc(info: FixClosureInfo): string[] {
  return getDeclarationSrc(info.toRequireType, info.ignoredRequireType, "goog.requireType");
}

function getForwardDeclareSrc(info: FixClosureInfo): string[] {
  return getDeclarationSrc(
    info.toForwardDeclare,
    info.ignoredForwardDeclare,
    "goog.forwardDeclare"
  );
}

function getDeclarationSrc(to: string[], ignored: string[], method: string): string[] {
  const declarations = to.map(namespace => `${method}('${namespace}');`);
  const ignores = ignored.map(namespace => `${method}('${namespace}'); // fixclosure: ignore`);
  return declarations.concat(ignores).sort();
}
