/**
 * 联合降本的流程定义：后端引擎按它们执行（现在是假后端的流转模拟），前端按它们画流程图、给出处理按钮。
 * 卡的状态由流程走到的节点决定：节点的 meta.status；实例挂起是“暂停”，被终止是“终止”
 */
import { processGraph, type ProcessDefinition, type ProcessInstance } from '@vue-tsx-pro/ui';
import { dmcProcess } from './dmc';
import { planProcess } from './plan';
import { suggestionProcess } from './suggestion';
import { taskProcess } from './task';
import { taskChangeProcess } from './task-change';

/** 全部流程定义（各自的最新版本） */
export const processDefinitions: readonly ProcessDefinition[] = [
  suggestionProcess,
  planProcess,
  taskProcess,
  dmcProcess,
  taskChangeProcess,
];

/** 流程的标识 */
export type ProcessKey = 'suggestion' | 'plan' | 'task' | 'dmc-implementation' | 'task-change';

/** 按标识找流程定义 */
export const processOf = (key: string) => processDefinitions.find((item) => item.key === key);

/**
 * 卡的业务状态：实例挂起是 paused、被终止是 terminated（没走到终止的结束节点时）；
 * 结束了按结束节点的 meta.status；进行中按正在处理的第一个节点；都没有时为 null
 */
export function statusOfInstance(
  definition: ProcessDefinition,
  instance: Pick<ProcessInstance, 'status' | 'active' | 'result'>,
): string | null {
  const graph = processGraph(definition);
  if (instance.status === 'suspended') return 'paused';
  if (instance.status === 'terminated' && !instance.result) return 'terminated';
  if (instance.status !== 'active') {
    const end = definition.nodes.find(
      (node) => node.type === 'end' && node.result === instance.result,
    );
    return (end?.meta?.status as string | undefined) ?? instance.result;
  }
  const node = instance.active.map((id) => graph.node(id)).find((item) => item?.meta?.status);
  return (node?.meta?.status as string | undefined) ?? null;
}

export { dmcProcess, planProcess, suggestionProcess, taskChangeProcess, taskProcess };
