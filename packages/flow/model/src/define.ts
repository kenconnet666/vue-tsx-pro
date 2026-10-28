/**
 * 在代码里写流程定义（docs/decisions/0001 的 3.2）：`defineProcess` 原样返回定义，类型从字面量推出——
 * 节点标识、每个人工节点的处理结果、流程变量的类型。设计器存的 JSON 与手写的定义是同一种东西，类型只帮写代码的人，
 * 从库里、设计器来的定义仍要按 validateProcess 在运行时校验。
 *
 *   export const purchase = defineProcess({ key: 'purchase', nodes: [...], edges: [...], variables: [...] });
 *   type Outcome = OutcomeOf<typeof purchase, 'manager'>;   // 'approve' | 'reject'
 *   type Vars = VariablesOf<typeof purchase>;               // { amount: number; supplier: string }
 */
import type { OrgId, ProcessDefinition, TaskNode, VariableType } from './definition.ts';

/** 带类型的流程定义：原样返回 */
export const defineProcess = <const D extends ProcessDefinition>(definition: D): D => definition;

/** 流程里的节点标识 */
export type NodeIdOf<D extends ProcessDefinition> = D['nodes'][number]['id'];

/** 流程里人工节点的标识 */
export type TaskIdOf<D extends ProcessDefinition> = Extract<D['nodes'][number], TaskNode>['id'];

/** 一个人工节点的处理结果 */
export type OutcomeOf<D extends ProcessDefinition, N extends TaskIdOf<D>> = Extract<
  D['nodes'][number],
  { readonly type: 'task'; readonly id: N }
>['outcomes'][number]['key'];

/** 流程变量的类型（按声明的 type；小数、日期、时刻是文字，同线上的写法） */
interface VariableValues {
  text: string;
  number: number;
  decimal: string;
  boolean: boolean;
  date: string;
  datetime: string;
  select: string;
  people: OrgId[];
}

/** 流程变量：声明的名字 → 值（都可以没有值） */
export type VariablesOf<D extends ProcessDefinition> = D['variables'] extends readonly (infer V)[]
  ? {
      [K in V extends { readonly name: infer N extends string } ? N : never]?: V extends {
        readonly name: K;
        readonly type: infer T extends VariableType;
      }
        ? VariableValues[T]
        : never;
    }
  : Record<string, unknown>;
