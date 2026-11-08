/**
 * 流程即一个小 TS 工程（docs/decisions/0002-projects.md）：在线编辑、仓库里写的都是这几份文件——
 *
 *   process.json   图：节点、连线、泳道、布局（设计器画的）
 *   form.ts        单据：`export default defineForm({ 字段: { label, type, … } })`，就是字段清单（manifest.ts，0004-forms.md），
 *                  推出单据的类型；发布时内联进定义的 form.manifest
 *   logic.ts       逻辑：`export default defineLogic(form, { resolvers, guards, actions, functions })`，
 *                  定义里写 `logic.名字` 引用
 *   views/*.tsx    需要时才写：自定义的发起页、审批单的分区、打印页
 *   test.ts        场景测试
 *
 * 文件之间相对路径 import；宿主登记的模块（组件库、zod、业务服务……）按名字 import。
 */
import type { OrgId } from './definition/definition.ts';
import type { FormManifest } from './form/manifest.ts';

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

/** 写单据：原样返回字段清单的字面量，字面量类型留着（推出 FormValues）；表单设计器读写的就是它 */
export const defineForm = <const M extends FormManifest>(manifest: M): M => manifest;

/** 字段类型 → 值（小数、日期、时刻是文字，同线上的写法；人员是编号） */
export interface FieldValues {
  text: string;
  number: number;
  decimal: string;
  boolean: boolean;
  date: string;
  datetime: string;
  select: string;
  people: OrgId[];
  file: { readonly name: string; readonly url: string; readonly size?: number }[];
  list: unknown[];
}

/** 一个字段的值：多选是数组，明细表是行（每行按列推出） */
type FieldValue<F> = F extends {
  readonly type: 'list';
  readonly fields: infer C extends FormManifest;
}
  ? FormValues<C>[]
  : F extends { readonly type: 'select'; readonly multiple: true }
    ? string[]
    : F extends { readonly type: infer T extends keyof FieldValues }
      ? FieldValues[T]
      : unknown;

/** 单据的值：必填的字段一定有，其余可以没有 */
export type FormValues<M extends FormManifest> = {
  -readonly [K in keyof M as M[K] extends { readonly required: true } ? K : never]: FieldValue<
    M[K]
  >;
} & {
  -readonly [K in keyof M as M[K] extends { readonly required: true } ? never : K]?: FieldValue<
    M[K]
  >;
};
