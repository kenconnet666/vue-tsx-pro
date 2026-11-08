/**
 * 表单权限矩阵：字段 × 环节一张表，每格是这个字段在这一步能不能看、能不能改（节点的 form.fields）。
 * 第一行是各环节没单独写的字段按什么（form.default），最后一列是不在待办里看单据的人（settings.formView）。
 * 改动交给 onChange，同 NodePanel。
 *
 *   <AccessMatrix definition={draft} onChange={(edit) => (draft = edit(draft))} />
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Select,
  Small,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@zerodep-dev/vue-tsx-pro-ui';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import {
  ACCESS_TEXT,
  accessItems,
  accessRows,
  fallbackText,
  patchFormView,
  patchNodeForm,
  withDefaultAccess,
  withFieldAccess,
  type DefinitionEdit,
  type FormNode,
} from './form-access';

/** AccessMatrix 的属性 */
export interface AccessMatrixProps {
  /** 流程定义：字段取它的表单清单（没有时是流程变量），列是开始与人工环节 */
  definition: ProcessDefinition;
  /** 改定义：设计器统一处理 */
  onChange: (edit: DefinitionEdit) => void;
}

/** 表单权限矩阵 */
export const AccessMatrix = _component(({ definition, onChange }: AccessMatrixProps) => {
  return () => {
    const rows = accessRows(definition);
    const steps = definition.nodes.filter(
      (node): node is FormNode => node.type === 'start' || node.type === 'task',
    );
    if (rows.length === 0) return <Small tone="muted">流程还没有表单字段。</Small>;
    const cell = (
      label: string,
      items: { value: string; label: string }[],
      value: string,
      set: (next: string) => void,
    ) => (
      <TableCell>
        <Select
          size="sm"
          items={items}
          _value={value}
          onUpdate:_value={(next: string | null) => set(next ?? 'inherit')}
          aria-label={label}
        />
      </TableCell>
    );
    return (
      <Table aria-label="表单权限">
        <TableHead>
          <TableRow>
            <TableHeaderCell>字段</TableHeaderCell>
            {steps.map((node) => (
              <TableHeaderCell key={node.id}>{node.name}</TableHeaderCell>
            ))}
            <TableHeaderCell>旁观的人</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableHeaderCell scope="row">没单独写的字段</TableHeaderCell>
            {steps.map((node) =>
              cell(
                `“${node.name}”没单独写的字段`,
                accessItems(
                  `默认（${ACCESS_TEXT[node.type === 'start' ? 'editable' : 'readonly']}）`,
                ),
                node.form?.default ?? 'inherit',
                (access) =>
                  onChange(patchNodeForm(node.id, (form) => withDefaultAccess(form, access))),
              ),
            )}
            <TableCell />
          </TableRow>
          {rows.map((row) => (
            <TableRow key={row.path}>
              <TableHeaderCell scope="row">{row.label}</TableHeaderCell>
              {steps.map((node) =>
                cell(
                  `“${row.label}”在“${node.name}”`,
                  accessItems(fallbackText(node, row)),
                  node.form?.fields?.[row.path] ?? 'inherit',
                  (access) =>
                    onChange(
                      patchNodeForm(node.id, (form) => withFieldAccess(form, row.path, access)),
                    ),
                ),
              )}
              {row.column ? (
                <TableCell />
              ) : (
                cell(
                  `“${row.label}”对旁观的人`,
                  accessItems('看得到', ['hidden', 'readonly']),
                  definition.settings?.formView?.[row.path] ?? 'inherit',
                  (access) => onChange(patchFormView(row.path, access)),
                )
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
});
