/**
 * 流程工作室的工具（docs/decisions/0002-projects.md）：流程工程的编译、类型检查（`./typecheck`，只在 Node 里），之后是在线编辑器。
 * 引擎不带编译器，发布流程工程时用这里的 transform：
 *
 *   createFlowEngine({ adapter, modules, transform: compileInPlace, checkTypes: createTypeChecker() })
 */
import type { TransformCode } from '@zerodep-dev/flow-ts-engine';

/**
 * 在当前线程编译（Node 里、测试里；会加载 Babel）：组件库的 browser-compile，与 Vite 预设同一个编译函数（去类型、Vue JSX、符文），
 * 导入导出改写成引擎链接器认的模块表。浏览器页面里用 createCompileClient 的 Worker 编译，界面不卡
 */
export const compileInPlace: TransformCode = async (source, path) => {
  const { compileInThread } = await import('@zerodep-dev/vue-tsx-pro-tsx/browser-compile');
  return compileInThread(source, { filename: path });
};
