/**
 * 合同审批写成流程工程（packages/flow/docs/decisions/0002-projects.md）：process.json 是图，form.ts 是单据，logic.ts 是逻辑。
 * Worker 发布时就地编译这几份源码（同在线工作室），引擎按版本存下源码与编译结果。
 *
 * 部门负责人 → 分头会审（并行：法务会签——法务部每个人都要通过；财务审核——财务的收件箱，通过前查付款计划的合计）→ 汇合 →
 * 超过 10 万再给总经理 → 法务盖章归档 → 按付款计划每一期调用一个“付款申请”（不等它们，合同就此生效）。
 * 会审区域里不通过用 terminate 直接结束整张单（另一边开着的待办一起取消），分支照样配对
 */
import type { FlowProject, ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import manifest from './form';
import formSource from './form.ts?raw';
import logicSource from './logic.ts?raw';
import processSource from './process.json?raw';

/** 发布用的工程 */
export const contractProject: FlowProject = {
  files: { 'process.json': processSource, 'form.ts': formSource, 'logic.ts': logicSource },
};

/** 页面用的定义（流程名、节点名）：图加上单据，同发布后内联的样子 */
export const contract: ProcessDefinition = {
  ...(JSON.parse(processSource) as ProcessDefinition),
  form: { key: 'contract', manifest },
};
