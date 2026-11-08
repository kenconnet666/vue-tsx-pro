/**
 * 按 schema 只读地显示一份值（审批单的查看、打印、提交前的核对）：标签与值排成 Descriptions，按分组各一块；
 * 选择题显示选项的文字（含登记的字典），开关、复选框显示是否，人员显示名字，附件显示文件名（有地址时是链接），
 * 嵌套的对象展开成“对象 · 字段”，对象的数组（列表、明细表）排成表格，写了 total 的列有合计。
 * 权限与条件同 useForm 的 access 与 meta 的 visibleWhen：不显示的不列。
 *
 *   <SchemaView schema={schema} values={order} access={{ cost: 'hidden' }} propsDescriptions={{ columns: 2 }} />
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import type { $ZodType } from 'zod/v4/core';
import { useConfig, useLang } from '../config/context';
import {
  Descriptions,
  type DescriptionItem,
  type DescriptionsProps,
} from '../display/Descriptions';
import { Link } from '../base/Link';
import {
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../table/Table';
import { mergePartProps } from '../utils/props';
import {
  columnTotal,
  isBlank,
  pickFields,
  schemaFields,
  walkSchemaFields,
  type FormSources,
  type SchemaField,
  type SchemaFieldState,
} from './schema-fields';
import type { FieldAccessMap } from './useForm';

/** SchemaView 的属性 */
export interface SchemaViewProps<Values extends object> {
  /** 生成字段的 schema（同 useForm 的） */
  schema: $ZodType<unknown, Values>;
  /** 要显示的值 */
  values: Values;
  /** 字段的权限（同 useForm 的 access）：hidden 的不列 */
  access?: FieldAccessMap;
  /** 只显示这些顶层字段，按这里的顺序 */
  pick?: readonly (keyof Values & string)[];
  /** 不显示这些顶层字段 */
  omit?: readonly (keyof Values & string)[];
  /** 数据来源（字典的选项文字）：合并在 createUi 的 formSources 之上 */
  sources?: FormSources;
  /** 每一块（Descriptions）的部件属性：栏数、样式 */
  propsDescriptions?: Partial<DescriptionsProps>;
}

/** SchemaView 的样式：明细表的合计行（同 SchemaForm 的） */
const schemaViewStyles = css.create({
  tableTotal: { fontWeight: '_semibold', fontVariantNumeric: 'tabular-nums' },
});

/** 选项的文字：固定的选项或登记的字典里找，找不到时是值本身 */
function optionText(field: SchemaField, value: unknown, sources: FormSources): string {
  const source = field.source === undefined ? undefined : sources.options?.[field.source];
  const options = (Array.isArray(source) ? source : undefined) ?? field.options ?? [];
  return options.find((option) => option.value === value)?.label ?? String(value);
}

/** 一个值显示成什么（不含列表、对象：它们另排） */
function displayValue(
  field: SchemaField,
  value: unknown,
  sources: FormSources,
  lang: ReturnType<typeof useLang>,
): VNodeChild {
  if (field.control === 'switch' || field.control === 'checkbox')
    return value ? lang.formValueTrue : lang.formValueFalse;
  if (isBlank(value)) return lang.formValueEmpty;
  const list = Array.isArray(value) ? value : [value];
  switch (field.control) {
    case 'select':
    case 'radio':
    case 'multiselect':
    case 'checkboxes':
      return list.map((item) => optionText(field, item, sources)).join('、');
    case 'people':
      return list.map((item) => (item as { name?: string }).name ?? String(item)).join('、');
    case 'file':
      return list.map((item, index) => {
        const file = item as { name?: string; url?: string };
        const name = file.name ?? String(item);
        return [
          index > 0 && '、',
          file.url ? (
            <Link key={file.url} href={file.url} external>
              {name}
            </Link>
          ) : (
            name
          ),
        ];
      });
    default:
      return field.unit ? `${String(value)} ${field.unit}` : String(value);
  }
}

/** 按 schema 只读地显示一份值 */
export const SchemaView = _component(
  <Values extends object>({
    schema,
    values,
    access = {},
    pick,
    omit,
    sources,
    propsDescriptions,
  }: SchemaViewProps<Values>) => {
    const lang = useLang();
    const config = useConfig();
    const merged = (): FormSources => {
      const base = config.formSources ?? {};
      return { ...base, ...sources, options: { ...base.options, ...sources?.options } };
    };

    /** 对象的数组排成表格：列是行里显示着的字段，写了 total 的列有合计 */
    function table(
      field: SchemaField,
      rows: readonly Record<string, unknown>[],
      visible: (path: string) => boolean,
      path: string,
    ) {
      const columns = (field.fields ?? []).filter((child) =>
        rows.some((_, index) => visible(`${path}.${index}.${child.key}`)),
      );
      const totals = columns.some((child) => child.total === 'sum');
      if (rows.length === 0) return lang.formValueEmpty;
      return (
        <Table aria-label={field.label}>
          <TableHead>
            <TableRow>
              {columns.map((child) => (
                <TableHeaderCell key={child.key} align={child.total ? 'end' : undefined}>
                  {child.label}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((child) => (
                  <TableCell key={child.key} align={child.total ? 'end' : undefined}>
                    {visible(`${path}.${index}.${child.key}`)
                      ? displayValue(child, row[child.key], merged(), lang)
                      : null}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
          {totals && (
            <TableFoot>
              <TableRow>
                {columns.map((child, i) => (
                  <TableCell
                    key={child.key}
                    align={child.total ? 'end' : undefined}
                    sx={schemaViewStyles.tableTotal}
                  >
                    {child.total === 'sum'
                      ? columnTotal(child, rows)
                      : i === 0
                        ? lang.tableSummary
                        : null}
                  </TableCell>
                ))}
              </TableRow>
            </TableFoot>
          )}
        </Table>
      );
    }

    return () => {
      const record = values as Record<string, unknown>;
      const states = new Map<string, SchemaFieldState>();
      walkSchemaFields(schemaFields(schema), record, access, (path, _, state) =>
        states.set(path, state),
      );
      const visible = (path: string) => states.get(path)?.visible ?? true;
      const items = (
        field: SchemaField,
        value: unknown,
        path: string,
        label: string,
      ): DescriptionItem[] => {
        if (!visible(path)) return [];
        if (field.control === 'object') {
          const inner = (value ?? {}) as Record<string, unknown>;
          return (field.fields ?? []).flatMap((child) =>
            items(child, inner[child.key], `${path}.${child.key}`, `${label} · ${child.label}`),
          );
        }
        if (field.control === 'list' || field.control === 'table') {
          const rows = (Array.isArray(value) ? value : []) as Record<string, unknown>[];
          return [{ key: path, label, value: table(field, rows, visible, path), span: 99 }];
        }
        return [
          {
            key: path,
            label,
            value: displayValue(field, value, merged(), lang),
            ...(field.span === 'full'
              ? { span: 99 }
              : typeof field.span === 'number'
                ? { span: field.span }
                : {}),
          },
        ];
      };
      // 分组各一块（页签里的字段也照分组排：只读、打印时一次看全）
      const groups = new Map<string | undefined, SchemaField[]>();
      for (const field of pickFields(schemaFields(schema), pick, omit)) {
        const name = field.group ?? field.tab;
        groups.set(name, [...(groups.get(name) ?? []), field]);
      }
      return [...groups].map(([name, list]) => (
        <Descriptions
          key={name ?? ''}
          {...mergePartProps<DescriptionsProps>(
            {
              columns: 'auto',
              items: list.flatMap((field) =>
                items(field, record[field.key], field.key, field.label),
              ),
            },
            propsDescriptions,
            name ? { title: name } : {},
          )}
        />
      ));
    };
  },
);
