/**
 * 设计器里改表单权限：字段的行（清单里的字段，明细表的列跟在后面）、下拉的选项、改一个字段后节点的 form 与流程的 formView。
 * 环节设置（NodePanel）与权限矩阵（AccessMatrix）共用。权限的含义见模型包 access.ts。
 */
import {
  formManifest,
  manifestField,
  manifestPaths,
  type FieldAccess,
  type NodeFormAccess,
  type ProcessDefinition,
  type ProcessNode,
} from '@zerodep-dev/flow-ts-model';
import { without } from '../utils/object';

/** 改定义的函数：设计器统一处理（模型包的函数报错时显示原因） */
export type DefinitionEdit = (current: ProcessDefinition) => ProcessDefinition;

/** 权限的说法 */
export const ACCESS_TEXT: Record<FieldAccess, string> = {
  hidden: '看不到',
  readonly: '只读',
  editable: '能改',
  required: '必须填',
};

/** 权限矩阵的一行 */
export interface AccessRow {
  /** 字段路径：明细表的列写成 `列表.列` */
  path: string;
  /** 显示的名字：明细表的列写成“明细 · 项目” */
  label: string;
  /** 是明细表的列：没单独写时跟着明细表 */
  column: boolean;
}

/** 单据的字段：流程的表单清单，没有表单时是流程变量（同引擎合算权限时） */
export function accessRows(definition: ProcessDefinition): AccessRow[] {
  const manifest = formManifest(definition);
  return manifestPaths(manifest).map((path) => {
    const dot = path.indexOf('.');
    const label = manifestField(manifest, path)!.label;
    return dot < 0
      ? { path, label, column: false }
      : { path, label: `${manifest[path.slice(0, dot)]!.label} · ${label}`, column: true };
  });
}

/** 有表单权限的节点：开始（发起时）与人工环节 */
export type FormNode = Extract<ProcessNode, { type: 'start' | 'task' }>;

/** 节点没写 default 时的权限：发起可改，别的只读（同模型包） */
export const nodeDefault = (node: FormNode): FieldAccess =>
  node.form?.default ?? (node.type === 'start' ? 'editable' : 'readonly');

/** 一个字段没单独写时按什么：明细表的列跟着明细表，别的按节点的 default */
export function fallbackText(node: FormNode, row: AccessRow): string {
  if (!row.column) return `按默认（${ACCESS_TEXT[nodeDefault(node)]}）`;
  const list = node.form?.fields?.[row.path.slice(0, row.path.indexOf('.'))];
  return `跟着明细表（${ACCESS_TEXT[list ?? nodeDefault(node)]}）`;
}

/** 下拉的选项：第一项是“没单独写”（值 inherit） */
export const accessItems = (fallback: string, only: readonly FieldAccess[] = ALL_ACCESS) => [
  { value: 'inherit', label: fallback },
  ...only.map((access) => ({ value: access, label: ACCESS_TEXT[access] })),
];

const ALL_ACCESS: readonly FieldAccess[] = ['hidden', 'readonly', 'editable', 'required'];

/** 节点的 form 改一个字段的权限（inherit 是去掉单独的写法）；都去掉时返回 undefined */
export function withFieldAccess(
  form: NodeFormAccess | undefined,
  path: string,
  access: string,
): NodeFormAccess | undefined {
  const fields = { ...form?.fields };
  if (access === 'inherit') delete fields[path];
  else fields[path] = access as FieldAccess;
  const next: NodeFormAccess = {
    ...(form?.default && { default: form.default }),
    ...(Object.keys(fields).length > 0 && { fields }),
  };
  return Object.keys(next).length ? next : undefined;
}

/** 节点的 form 改 default（inherit 是去掉） */
export function withDefaultAccess(
  form: NodeFormAccess | undefined,
  access: string,
): NodeFormAccess | undefined {
  const next: NodeFormAccess = {
    ...(access !== 'inherit' && { default: access as FieldAccess }),
    ...(form?.fields && { fields: form.fields }),
  };
  return Object.keys(next).length ? next : undefined;
}

/** 改一个节点的 form（开始、人工环节；别的节点原样） */
export function patchNodeForm(
  id: string,
  update: (form: NodeFormAccess | undefined) => NodeFormAccess | undefined,
): DefinitionEdit {
  return (current) => ({
    ...current,
    nodes: current.nodes.map((node) => {
      if (node.id !== id || (node.type !== 'start' && node.type !== 'task')) return node;
      const form = update(node.form);
      // Omit 在联合类型上丢了区分字段：去掉的只是可选的 form，还是同一种节点
      return form ? { ...node, form } : (without(node, 'form') as ProcessNode);
    }),
  });
}

/** 改不在待办里看单据的人对一个字段的权限（settings.formView；inherit 是去掉，看得到） */
export function patchFormView(path: string, access: string): DefinitionEdit {
  return (current) => {
    const view = { ...current.settings?.formView };
    if (access === 'inherit') delete view[path];
    else view[path] = access as 'hidden' | 'readonly';
    const settings = Object.keys(view).length
      ? { ...current.settings, formView: view }
      : without({ ...current.settings }, 'formView');
    return Object.keys(settings).length ? { ...current, settings } : without(current, 'settings');
  };
}
