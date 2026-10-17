/**
 * TSX 语言服务核心。
 *
 * 直接使用仓库固定的 TypeScript LanguageService，按文件所在的 tsconfig.json 建立项目，
 * 因此结果与 `pnpm typecheck` 一致（同版本、同 customConditions、同 jsxImportSource）。
 * 诊断额外附带符文编译器的误用报错。只处理 .ts / .tsx / .mts / .cts，不涉及 Vue SFC。
 */
import ts from 'typescript';
import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);
// 与编译器的判断一致：用到符文，或定义了组件（参数默认值、prop 写入检查）
const NEEDS_COMPILE =
  /\b_(?:state|derived|bindable|from|ref)\b|\b(?:_component|defineComponent)\s*\(/;
const COMPILER_ENTRY = 'packages/tsx/src/compiler/index.ts';

/** TypeScript 内部统一使用正斜杠；不区分大小写的系统再统一小写，便于比较 */
function pathKey(path) {
  const normalized = path.replaceAll('\\', '/');
  return ts.sys.useCaseSensitiveFileNames ? normalized : normalized.toLowerCase();
}

function modifiedTime(path) {
  try {
    return statSync(path).mtimeMs;
  } catch {
    return -1;
  }
}

/** 一个 tsconfig.json 对应的 LanguageService */
class Project {
  constructor(configPath) {
    this.configPath = configPath;
    this.load();
  }

  load() {
    const extendedConfigCache = new Map();
    const parsed = ts.getParsedCommandLineOfConfigFile(
      this.configPath,
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
          throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
        },
      },
      extendedConfigCache,
    );

    this.options = parsed.options;
    this.fileNames = parsed.fileNames;
    this.fileKeys = new Set(parsed.fileNames.map(pathKey));
    // 记录自身及 extends 链上配置文件的修改时间，任一变化即重建
    this.configFiles = [this.configPath, ...extendedConfigCache.keys()];
    this.configTimes = this.configFiles.map(modifiedTime);

    const host = {
      getCompilationSettings: () => this.options,
      getScriptFileNames: () => this.fileNames,
      // 以修改时间作为版本：文件在编辑器里保存后立即生效，无需通知
      getScriptVersion: (fileName) => String(modifiedTime(fileName)),
      getScriptSnapshot: (fileName) =>
        existsSync(fileName)
          ? ts.ScriptSnapshot.fromString(readFileSync(fileName, 'utf8'))
          : undefined,
      getCurrentDirectory: () => dirname(this.configPath),
      getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
      // 文件系统访问直接委托给 TypeScript 自带的 ts.sys
      fileExists: (path) => ts.sys.fileExists(path),
      readFile: (path, encoding) => ts.sys.readFile(path, encoding),
      readDirectory: (path, extensions, exclude, include, depth) =>
        ts.sys.readDirectory(path, extensions, exclude, include, depth),
      directoryExists: (path) => ts.sys.directoryExists(path),
      getDirectories: (path) => ts.sys.getDirectories(path),
      realpath: (path) => ts.sys.realpath?.(path) ?? path,
      useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
    };
    this.service = ts.createLanguageService(host, ts.createDocumentRegistry());
  }

  isStale() {
    return this.configFiles.some((file, index) => modifiedTime(file) !== this.configTimes[index]);
  }

  includes(file) {
    return this.fileKeys.has(pathKey(file));
  }

  sourceFile(file) {
    const sourceFile = this.service.getProgram()?.getSourceFile(file);
    if (!sourceFile) throw new Error(`TypeScript 未加载该文件：${file}`);
    return sourceFile;
  }
}

export class TsxWorkspace {
  /** @type {Map<string, Project>} tsconfig 路径 → 项目 */
  #projects = new Map();
  #compileRunes;

  constructor(root) {
    this.root = realpathSync.native(resolve(root));
  }

  // ───────────────────────── 文件与项目 ─────────────────────────

  /** 把调用方给的路径解析为工作区内的绝对路径；越界或扩展名不支持时报错 */
  resolveFile(filePath) {
    const absolute = realpathSync.native(resolve(this.root, filePath));
    const fromRoot = relative(this.root, absolute);
    if (isAbsolute(fromRoot) || fromRoot === '..' || fromRoot.startsWith('..' + sep)) {
      throw new Error('文件不在工作区内：' + filePath);
    }
    if (!SUPPORTED_EXTENSIONS.has(extname(absolute))) {
      throw new Error('只支持 .ts / .tsx / .mts / .cts 文件：' + filePath);
    }
    return absolute.replaceAll('\\', '/');
  }

  /** 从文件所在目录向上，找到第一个包含它的 tsconfig.json */
  projectFor(file) {
    for (let directory = dirname(file); ; directory = dirname(directory)) {
      const configPath = join(directory, 'tsconfig.json').replaceAll('\\', '/');
      if (existsSync(configPath)) {
        let project = this.#projects.get(configPath);
        if (!project) {
          project = new Project(configPath);
          this.#projects.set(configPath, project);
        } else if (project.isStale() || !project.includes(file)) {
          // 配置变了，或者是新建的文件：重新解析一次 include
          project.load();
        }
        if (project.includes(file)) return project;
      }
      if (pathKey(directory) === pathKey(this.root) || dirname(directory) === directory) break;
    }
    throw new Error('没有任何 tsconfig.json 包含该文件：' + this.display(file));
  }

  /** 工作区内的文件显示为相对路径，其余显示绝对路径 */
  display(file) {
    const fromRoot = relative(this.root, file);
    return isAbsolute(fromRoot) || fromRoot.startsWith('..')
      ? file
      : fromRoot.replaceAll('\\', '/');
  }

  // ───────────────────────── 位置换算（对外统一 1 起始） ─────────────────────────

  #offset(project, file, line, column) {
    const sourceFile = project.sourceFile(file);
    const lineStarts = sourceFile.getLineStarts();
    if (line > lineStarts.length) throw new Error(`第 ${line} 行超出文件范围`);
    const lineEnd = line < lineStarts.length ? lineStarts[line] : sourceFile.text.length;
    if (lineStarts[line - 1] + column - 1 > lineEnd)
      throw new Error(`第 ${line} 行第 ${column} 列超出范围`);
    return ts.getPositionOfLineAndCharacter(sourceFile, line - 1, column - 1);
  }

  #range(project, fileName, start, length) {
    const sourceFile = project.service.getProgram()?.getSourceFile(fileName);
    if (!sourceFile) return undefined;
    const toPoint = (offset) => {
      const { line, character } = sourceFile.getLineAndCharacterOfPosition(offset);
      return { line: line + 1, column: character + 1 };
    };
    return { start: toPoint(start), end: toPoint(start + length) };
  }

  #at(filePath, line, column) {
    const file = this.resolveFile(filePath);
    const project = this.projectFor(file);
    return { file, project, offset: this.#offset(project, file, line, column) };
  }

  // ───────────────────────── 语言功能 ─────────────────────────

  async diagnostics(filePath) {
    const file = this.resolveFile(filePath);
    const project = this.projectFor(file);
    const typescript = [
      ...project.service.getSyntacticDiagnostics(file),
      ...project.service.getSemanticDiagnostics(file),
    ].map((diagnostic) => ({
      source: 'typescript',
      code: 'TS' + diagnostic.code,
      severity: severityName(diagnostic.category),
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
      range:
        diagnostic.start === undefined
          ? undefined
          : this.#range(project, file, diagnostic.start, diagnostic.length ?? 0),
    }));

    const runes = await this.#runesDiagnostics(file);
    const diagnostics = [...typescript, ...runes];
    return {
      filePath: this.display(file),
      tsconfig: this.display(project.configPath),
      typescript: ts.version,
      errors: diagnostics.filter((item) => item.severity === 'error').length,
      diagnostics,
    };
  }

  /** 用真实的符文编译器编译一遍；它在第一处误用（或语法错误）时报错并给出位置 */
  async #runesDiagnostics(file) {
    const text = readFileSync(file, 'utf8');
    if (!NEEDS_COMPILE.test(text)) return [];
    this.#compileRunes ??= (
      await import(pathToFileURL(join(this.root, COMPILER_ENTRY)).href)
    ).compileRunes;
    try {
      await this.#compileRunes(text, file);
      return [];
    } catch (error) {
      // 消息形如 "<文件>: <说明>\n<代码帧>"，只保留说明
      const message = String(error.message)
        .split('\n')[0]
        .replace(/^.*?:\s/, '');
      return [
        {
          source: 'runes',
          code: 'RUNES',
          severity: 'error',
          message,
          range: babelRange(error.loc),
        },
      ];
    }
  }

  hover(filePath, line, column) {
    const { file, project, offset } = this.#at(filePath, line, column);
    const info = project.service.getQuickInfoAtPosition(file, offset);
    if (!info) return { filePath: this.display(file), contents: null };
    return {
      filePath: this.display(file),
      kind: info.kind,
      contents: ts.displayPartsToString(info.displayParts),
      documentation: ts.displayPartsToString(info.documentation) || undefined,
      tags: info.tags?.map((tag) => ({ name: tag.name, text: ts.displayPartsToString(tag.text) })),
      range: this.#range(project, file, info.textSpan.start, info.textSpan.length),
    };
  }

  definitions(filePath, line, column, limit) {
    const { file, project, offset } = this.#at(filePath, line, column);
    const items = project.service.getDefinitionAtPosition(file, offset) ?? [];
    return {
      total: items.length,
      items: items.slice(0, limit).map((item) => ({
        filePath: this.display(item.fileName),
        name: item.name,
        kind: item.kind,
        range: this.#range(project, item.fileName, item.textSpan.start, item.textSpan.length),
      })),
    };
  }

  references(filePath, line, column, limit) {
    const { file, project, offset } = this.#at(filePath, line, column);
    const items = project.service.getReferencesAtPosition(file, offset) ?? [];
    return {
      total: items.length,
      items: items.slice(0, limit).map((item) => ({
        filePath: this.display(item.fileName),
        isWriteAccess: item.isWriteAccess,
        isDefinition: item.isDefinition ?? false,
        range: this.#range(project, item.fileName, item.textSpan.start, item.textSpan.length),
      })),
    };
  }

  completions(filePath, line, column, prefix, limit, detailLimit) {
    const { file, project, offset } = this.#at(filePath, line, column);
    const result = project.service.getCompletionsAtPosition(file, offset, {
      includeCompletionsWithInsertText: true,
      includeCompletionsForModuleExports: true,
    });
    const entries = (result?.entries ?? []).filter((entry) => entry.name.startsWith(prefix));
    const selected = entries.slice(0, limit);
    return {
      total: entries.length,
      isIncomplete: result?.isIncomplete ?? false,
      items: selected.map((entry, index) => {
        const item = {
          name: entry.name,
          kind: entry.kind,
          kindModifiers: entry.kindModifiers || undefined,
          insertText: entry.insertText,
          source: entry.source,
        };
        if (index >= detailLimit) return item;
        // 按需取签名与文档：逐项查询较慢，默认不取
        const details = project.service.getCompletionEntryDetails(
          file,
          offset,
          entry.name,
          undefined,
          entry.source,
          undefined,
          entry.data,
        );
        return {
          ...item,
          detail: details && ts.displayPartsToString(details.displayParts),
          documentation: (details && ts.displayPartsToString(details.documentation)) || undefined,
        };
      }),
    };
  }
}

/**
 * Babel 错误位置有两种形状：符文编译器抛出的 { start, end }，解析器语法错误的 { line, column }。
 * Babel 的行从 1 开始、列从 0 开始，这里统一成 1 起始。
 */
function babelRange(loc) {
  if (!loc) return undefined;
  const toPoint = (point) => ({ line: point.line, column: point.column + 1 });
  if (loc.start) return { start: toPoint(loc.start), end: toPoint(loc.end ?? loc.start) };
  if (typeof loc.line === 'number') return { start: toPoint(loc), end: toPoint(loc) };
  return undefined;
}

function severityName(category) {
  switch (category) {
    case ts.DiagnosticCategory.Error:
      return 'error';
    case ts.DiagnosticCategory.Warning:
      return 'warning';
    case ts.DiagnosticCategory.Suggestion:
      return 'suggestion';
    case ts.DiagnosticCategory.Message:
      return 'message';
    default:
      return 'unknown';
  }
}
