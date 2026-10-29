/**
 * 字段对比：两份记录（编辑前后、测算的两个版本、审批前后）按字段列出原值与新值，数值字段带上变化量与变化率。
 * 建在 diffFields 上；字段的写法与表格的列定义相同（key、header、type、format、statuses、empty、value、cell），
 * 表格里已有的列定义可以直接拿来用。
 *
 *   <FieldCompare fields={columns} before={v1} after={v2} />                      // 表格：字段、原值、新值、变化
 *   <FieldCompare fields={columns} before={old} after={row} layout="list" />      // 列表：只列改了的，“¥1,200 → ¥1,350 +12.5%”
 *
 * 表格默认列出全部字段（没改的淡显），列表默认只列改了的（放在时间线、通知、审批意见里）；onlyChanged 可以改。
 * 数值字段的变化量按字段的 type、format 显示，带正负号；写了 better 时按好坏着色（成本、耗时写 'lower'）。
 *
 * 读屏：列表里原值是 del、新值是 ins，两者之间有“改为”（画面上是箭头）。
 * 部件：Root（div）、Table（ColumnTable，表格时）、List（dl，列表时）、Item（div）、Label（dt）、Value（dd）。
 */
import { ArrowRight } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { useLang } from '../config/context';
import { useFormat } from '../config/lang/format';
import { diffFields, type FieldDiff } from '../utils/data/diff';
import { toNumber } from '../utils/data/numeric';
import type { SortValue } from '../utils/data/collation';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { toneStyles } from '../utils/style/typography';
import { useColumnDisplay } from '../table/column-display';
import { ColumnTable, type ColumnTableProps } from '../table/ColumnTable';
import {
  columnType,
  columnValue,
  formatCell,
  type ColumnTypes,
  type DataTableColumn,
} from '../table/columns';

/**
 * 一个要对比的字段：写法同表格的列（key、header、type、format、statuses、empty、value），
 * cell 的第二个参数是 0（原值那一份）或 1（新值那一份）
 */
export interface CompareField<T> extends Pick<
  DataTableColumn<T>,
  'key' | 'header' | 'type' | 'format' | 'statuses' | 'empty' | 'value' | 'cell'
> {
  /** 数值变化的好坏：'higher' 越高越好（变化量升是绿、降是红），'lower' 越低越好（成本、耗时）；不写时不着色 */
  better?: 'higher' | 'lower';
}

/** 对比的一行：字段与它的比较结果 */
export interface FieldCompareRow<T> extends FieldDiff<Record<string, SortValue>, string> {
  /** 字段 */
  field: CompareField<T>;
}

/** 未声明的属性落到外层 div 上 */
export interface FieldCompareProps<T> extends PartProps<'div'> {
  /** 对比哪些字段，按这个顺序 */
  fields: readonly CompareField<T>[];
  /** 原来的记录；没有（新建）时每个字段都当作空 */
  before: T | null | undefined;
  /** 现在的记录 */
  after: T | null | undefined;
  /** 'table' 字段、原值、新值、变化四列（默认）；'list' 一行一个字段：原值 → 新值 变化 */
  layout?: 'table' | 'list';
  /** 只列改了的字段；默认表格列出全部、列表只列改了的 */
  onlyChanged?: boolean;
  /** 表格的部件属性（layout 为 'table' 时） */
  propsTable?: Partial<ColumnTableProps<FieldCompareRow<T>>>;
  /** 列表（dl）的部件属性（layout 为 'list' 时） */
  propsList?: PartProps<'dl'>;
  /** 列表里每一项的部件属性 */
  propsItem?: PartProps<'div'>;
  /** 字段名（dt）的部件属性 */
  propsLabel?: PartProps<'dt'>;
  /** 值（dd）的部件属性 */
  propsValue?: PartProps<'dd'>;
}

/** FieldCompare 的样式：list、item、label、value、before、after、arrow、unchanged、changed */
export const fieldCompareStyles = css.create({
  // 字段名一列、值一列：多项时字段名对齐
  list: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: '_md',
    rowGap: '_xs',
    margin: 0,
  },
  item: { display: 'contents' },
  label: { color: '_textMuted' },
  value: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: '_xs',
    margin: 0,
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  before: { color: '_textMuted', textDecorationLine: 'line-through' },
  after: { textDecorationLine: 'none', color: '_text', fontWeight: '_medium' },
  arrow: { alignSelf: 'center', color: '_textMuted', flexShrink: 0 },
  change: { fontSize: '_sm', fontVariantNumeric: 'tabular-nums' },
  // 表格里没改的字段淡显，改了的新值加粗
  unchanged: { color: '_textMuted' },
  changed: { fontWeight: '_medium' },
  none: { color: '_textMuted' },
});

/** 字段对比：表格或列表 */
export const FieldCompare = _component(
  <T,>({
    fields,
    before,
    after,
    layout = 'table',
    onlyChanged,
    propsTable,
    propsList,
    propsItem,
    propsLabel,
    propsValue,
    ...rest
  }: FieldCompareProps<T>) => {
    const lang = useLang();
    const format = useFormat();
    const display = useColumnDisplay<T>();
    const column = (field: CompareField<T>) => field as DataTableColumn<T>;

    /** 每个字段在一份记录里的值（按 value 函数或字段名取） */
    const valuesOf = (record: T | null | undefined) =>
      Object.fromEntries(
        fields.map((field) => [
          field.key,
          record == null ? undefined : columnValue(column(field), record),
        ]),
      );

    const rows = (): FieldCompareRow<T>[] => {
      const diffs = diffFields(
        valuesOf(before),
        valuesOf(after),
        fields.map((field) => field.key),
      );
      const all = diffs.map((diff, index) => ({ ...diff, field: fields[index]! }));
      return (onlyChanged ?? layout === 'list') ? all.filter((row) => row.changed) : all;
    };

    /** 字段的值类型：写了 type 用它，否则按两份记录推断（同表格的列） */
    const typeOf = (field: CompareField<T>): keyof ColumnTypes =>
      columnType(
        column(field),
        [before, after].filter((record): record is T => record != null),
      );

    /** 一份记录里这个字段的显示：cell 优先，否则按类型格式化（同表格） */
    const shown = (row: FieldCompareRow<T>, side: 0 | 1): VNodeChild => {
      const record = side === 0 ? before : after;
      if (row.field.cell && record != null) return row.field.cell(record, side);
      return display.value(
        column(row.field),
        typeOf(row.field),
        side === 0 ? row.before : row.after,
      );
    };

    /** 数值字段的变化：变化量（按字段的格式，带正负号）与变化率；没变或不是数值时没有 */
    const change = (row: FieldCompareRow<T>): VNodeChild => {
      if (!row.changed || row.delta === undefined) return null;
      const type = typeOf(row.field);
      const signed = { ...row.field.format, signDisplay: 'exceptZero' } as const;
      const delta = formatCell(row.delta, type === 'text' ? 'number' : type, format, signed);
      // 百分比字段的变化量本身就是百分点，不再给变化率
      const ratio =
        row.ratio !== undefined && type !== 'percent'
          ? format.number(row.ratio, {
              style: 'percent',
              maximumFractionDigits: 1,
              signDisplay: 'exceptZero',
            })
          : null;
      const sign = Math.sign(toNumber(row.delta));
      const tone =
        !row.field.better || sign === 0
          ? toneStyles.muted
          : sign > 0 === (row.field.better === 'higher')
            ? toneStyles.success
            : toneStyles.danger;
      return (
        <span {...css.attrs(fieldCompareStyles.change, tone)}>
          {delta}
          {ratio && `（${ratio}）`}
        </span>
      );
    };

    const none = () => <span {...css.attrs(fieldCompareStyles.none)}>{lang.fieldCompareNone}</span>;

    const table = (list: FieldCompareRow<T>[]) => {
      const [field, from, to, delta] = lang.fieldCompareHeaders;
      const numeric = list.some((row) => row.changed && row.delta !== undefined);
      const columns: DataTableColumn<FieldCompareRow<T>>[] = [
        { key: 'field', header: field, cell: (row) => row.field.header },
        {
          key: 'before',
          align: 'start',
          header: from,
          cell: (row) => <span {...css.attrs(fieldCompareStyles.unchanged)}>{shown(row, 0)}</span>,
        },
        {
          key: 'after',
          align: 'start',
          header: to,
          cell: (row) => (
            <span
              {...css.attrs(
                row.changed ? fieldCompareStyles.changed : fieldCompareStyles.unchanged,
              )}
            >
              {shown(row, 1)}
            </span>
          ),
        },
        ...(numeric
          ? [{ key: 'change', header: delta, align: 'start' as const, cell: change }]
          : []),
      ];
      return (
        <ColumnTable
          {...mergePartProps<Partial<ColumnTableProps<FieldCompareRow<T>>>>(
            { density: 'compact' },
            propsTable,
          )}
          rows={list}
          columns={columns}
          getKey={(row) => row.field.key}
          propsRow={(row) => ({ 'data-changed': row.changed || undefined }) as PartProps<'tr'>}
        />
      );
    };

    const list = (items: FieldCompareRow<T>[]) => (
      <dl {...mergeAttrs<'dl'>({ sx: fieldCompareStyles.list }, propsList)}>
        {items.map((row) => (
          <div
            key={row.field.key}
            {...mergeAttrs<'div'>({ sx: fieldCompareStyles.item }, propsItem)}
          >
            <dt {...mergeAttrs<'dt'>({ sx: fieldCompareStyles.label }, propsLabel)}>
              {row.field.header}
            </dt>
            <dd {...mergeAttrs<'dd'>({ sx: fieldCompareStyles.value }, propsValue)}>
              {before != null && (
                <>
                  <del {...css.attrs(fieldCompareStyles.before)}>{shown(row, 0)}</del>
                  <Icon icon={ArrowRight} sx={fieldCompareStyles.arrow} />
                  <VisuallyHidden>{lang.fieldCompareTo}</VisuallyHidden>
                </>
              )}
              <ins {...css.attrs(fieldCompareStyles.after)}>{shown(row, 1)}</ins>
              {change(row)}
            </dd>
          </div>
        ))}
      </dl>
    );

    return () => {
      const items = rows();
      return (
        <div {...mergeAttrs<'div'>({}, rest)}>
          {items.length === 0 ? none() : layout === 'list' ? list(items) : table(items)}
        </div>
      );
    };
  },
);
