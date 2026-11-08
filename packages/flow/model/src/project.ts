/**
 * 流程即一个小 TS 工程（docs/decisions/0002-projects.md）：在线编辑、仓库里写的都是这几份文件——
 *
 *   process.json   图：节点、连线、泳道、布局（设计器画的）
 *   form.ts        单据：`export default defineForm({ fields })`，字段推出单据的类型，发布时生成流程变量的声明
 *   logic.ts       逻辑：`export default defineLogic<typeof form>({ resolvers, guards, actions, functions })`，
 *                  定义里写 `logic.名字` 引用
 *   views/*.tsx    需要时才写：自定义的发起页、审批单的分区、打印页
 *   test.ts        场景测试
 *
 * 文件之间相对路径 import；宿主登记的模块（组件库、zod、业务服务……）按名字 import。
 */
import type { OrgId, VariableDeclaration, VariableType } from './definition.ts';

/** 一个流程工程：路径 → 源码；`process.json` 必须有 */
export interface FlowProject {
  readonly files: Readonly<Record<string, string>>;
}

/** 约定的文件 */
export const PROJECT_FILES = {
  process: 'process.json',
  form: 'form.ts',
  logic: 'logic.ts',
  test: 'test.ts',
} as const;

/** 单据的一个字段 */
export interface FormField {
  readonly type: VariableType;
  readonly label?: string;
  readonly required?: boolean;
  readonly default?: unknown;
  /** 选择题的选项 */
  readonly options?: readonly { readonly value: string; readonly label?: string }[];
}

/** 单据：字段名 → 字段 */
export interface FormDefinition<
  F extends Readonly<Record<string, FormField>> = Readonly<Record<string, FormField>>,
> {
  readonly fields: F;
}

/** 写单据：原样返回，字段的字面量类型留着（推出 FormValues） */
export const defineForm = <const F extends Readonly<Record<string, FormField>>>(
  form: FormDefinition<F>,
): FormDefinition<F> => form;

/** 字段类型 → 值（小数、日期、时刻是文字，同线上的写法） */
export interface FieldValues {
  text: string;
  number: number;
  decimal: string;
  boolean: boolean;
  date: string;
  datetime: string;
  select: string;
  people: OrgId[];
}

/** 单据的值：必填的字段一定有，其余可以没有 */
export type FormValues<Form extends FormDefinition> = {
  -readonly [
    K in keyof Form['fields'] as Form['fields'][K] extends { readonly required: true } ? K : never
  ]: FieldValues[Form['fields'][K]['type']];
} & {
  -readonly [
    K in keyof Form['fields'] as Form['fields'][K] extends { readonly required: true } ? never : K
  ]?: FieldValues[Form['fields'][K]['type']];
};

/** 单据 → 流程变量的声明（发布时并进定义） */
export function formVariables(form: FormDefinition): VariableDeclaration[] {
  return Object.entries(form.fields).map(([name, field]) => ({
    name,
    type: field.type,
    ...(field.label !== undefined ? { label: field.label } : {}),
    ...(field.default !== undefined ? { default: field.default } : {}),
  }));
}
