/**
 * 发布前的类型检查（`@zerodep-dev/flow-ts-studio/typecheck`，只在 Node 里）：TypeScript 7 的 API 在宿主的目录上叠一层内存文件——
 * 工程的文件、宿主模块的声明——真装着的包（模型包、引擎、组件库、zod）照常从 node_modules 解析。要装 typescript 7。
 *
 *   createFlowEngine({ …, modules, checkTypes: createTypeChecker() })
 */
import { API, type RawCompilerOptions } from 'typescript/sync';
import { createFileSystemLayer } from 'typescript/fs';
import type { FlowProject } from '@zerodep-dev/flow-ts-model';
import type { CheckTypes, HostModules, TypeProblem } from '@zerodep-dev/flow-ts-engine';

/** createTypeChecker 的选项 */
export interface TypeCheckerOptions {
  /** 从哪个目录解析 node_modules：宿主应用的目录，默认当前目录 */
  readonly root?: string;
  /** 再加的编译选项（枚举写数字，同 TypeScript API 的原始选项） */
  readonly compilerOptions?: RawCompilerOptions;
}

/** 工程的文件放在 root 下的这个虚拟目录里（不写盘） */
const DIR = '.flow-project';

/** 检查用的编译选项：同组件库的 TSX（保留 JSX、jsxImportSource）；ESNext、Bundler 解析 */
const BASE_OPTIONS: RawCompilerOptions = {
  strict: true,
  noEmit: true,
  skipLibCheck: true,
  target: 99,
  module: 99,
  moduleResolution: 100,
  jsx: 1,
  jsxImportSource: '@zerodep-dev/vue-tsx-pro-tsx',
  lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
  allowImportingTsExtensions: true,
};

/** 建一个类型检查：每次检查起一个 TypeScript 进程，做完就关 */
export function createTypeChecker(options: TypeCheckerOptions = {}): CheckTypes {
  const root = (options.root ?? process.cwd()).replaceAll('\\', '/').replace(/\/$/, '');
  return (project, modules) => check(project, modules, root, options.compilerOptions ?? {});
}

function check(
  project: FlowProject,
  modules: HostModules,
  root: string,
  extra: RawCompilerOptions,
): TypeProblem[] {
  const base = `${root}/${DIR}`;
  const code = Object.entries(project.files).filter(([path]) => /\.tsx?$/.test(path));
  const files: [string, string][] = code.map(([path, source]) => [`${base}/${path}`, source]);
  // 带声明的宿主模块装成虚拟的包：import 时与真装着的包一样解析
  for (const [name, module] of Object.entries(modules)) {
    if (module.types === undefined) continue;
    files.push(
      [`${base}/node_modules/${name}/package.json`, JSON.stringify({ name, types: 'index.d.ts' })],
      [`${base}/node_modules/${name}/index.d.ts`, module.types],
    );
  }
  using api = new API({ cwd: base });
  const snapshot = api.createSnapshot({
    fileSystem: createFileSystemLayer(files),
    createPrograms: [
      {
        rootFiles: code.map(([path]) => `${base}/${path}`),
        compilerOptions: { ...BASE_OPTIONS, ...extra },
      },
    ],
  });
  const program = snapshot.operation.createdPrograms?.[0];
  if (!program) throw new Error('TypeScript 没有建出程序');
  const diagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program.getProgramDiagnostics(),
  ];
  return diagnostics.map((diagnostic) => {
    const file = diagnostic.fileName?.replaceAll('\\', '/') ?? '';
    return {
      file: file.startsWith(`${base}/`) ? file.slice(base.length + 1) : file,
      line: (diagnostic.startPosition?.line ?? 0) + 1,
      column: (diagnostic.startPosition?.character ?? 0) + 1,
      code: diagnostic.code,
      message: diagnostic.text,
    };
  });
}
