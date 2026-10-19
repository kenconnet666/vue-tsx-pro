/**
 * 列表框（role="listbox"）：在一列选项里单选或多选。数据驱动，始终虚拟滚动（上万个选项也只渲染看得见的几十个）：
 *
 *   <Listbox items={cities} value={_bind(city)} aria-label="城市" />
 *   <Listbox items={tags} type="multiple" value={_bind(picked)}>{(option) => <Badge>{option.label}</Badge>}</Listbox>
 *
 * 选项是 { value, label, disabled?, description?, icon?, group? }（ListboxOption）；需要自定义内容时传渲染函数。
 * 焦点在列表上，高亮项经 aria-activedescendant 告诉读屏：↑↓、Home / End、Page Up / Down 移动，
 * Enter / 空格选中，按字母跳到以它开头的项。状态与键盘见 list-state.ts；Select、Combobox 用同一个 ListboxView 渲染。
 *
 * 虚拟滚动（useVirtualizer）：高亮项总在渲染范围里（aria-activedescendant 才指得到），键盘移动时滚进可见范围；
 * 选项带 aria-setsize / aria-posinset，读屏知道总数与位置。分组标题只是视觉上的一行（各行独立定位，没法用
 * role="group" 包住组里的选项），组名经 aria-describedby 交给组里的每个选项。
 * loading：没有选项时显示骨架行；已有选项（刷新中）时顶部显示一条进度条；列表带 aria-busy。
 *
 * 部件：Root（div，role="listbox"）、GroupLabel、Option（div，role="option"）、Check（已选标记）、Skeleton（加载中的占位行）。
 */
import { Check } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { useId, watch, type VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { Text, type TextProps } from '../base/Text';
import { useLang } from '../config/context';
import { Empty, type EmptyProps } from '../feedback/Empty';
import { Progress } from '../feedback/Progress';
import { Skeleton, type SkeletonProps } from '../feedback/Skeleton';
import { itemStyles } from '../utils/style/item-styles';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { selectedValues, type SelectionModes } from '../utils/data/selection';
import { focusRingStyles, type StyleTable } from '../utils/style/styles';
import { useVirtualizer } from '../utils/virtual/use-virtualizer';
import { defaultRangeExtractor } from '../utils/virtual/virtualizer';
import { useFieldControl } from './Field';
import { useListState, handleListKeydown, type ListboxOption, type ListState } from './list-state';

/** 选项的渲染状态：渲染函数据此画高亮、已选的样子 */
export interface OptionRenderState {
  /** 已选 */
  selected: boolean;
  /** 高亮（键盘或指针所在） */
  active: boolean;
}

/** 选项的部件属性：可以按选项计算 */
type OptionProps<T> =
  | PartProps<'div', 'role' | 'id' | 'aria-selected' | 'aria-disabled'>
  | ((option: T, state: OptionRenderState) => PartProps<'div'>);

/** ListboxView 的属性：Listbox、Select、Combobox 共用的渲染层 */
export interface ListboxViewProps<T extends ListboxOption> extends PartProps<'div', 'role'> {
  /** 列表状态（createListState） */
  list: ListState<T>;
  /** 列表的 id；选项的 id 是 `${id}-${序号}`（aria-activedescendant 指向它） */
  id: string;
  /** 多选：aria-multiselectable */
  multiple?: boolean;
  /** 滚动容器：Select、Combobox 的弹出层；不给时列表自己滚动（最高 20em，用 sx 改） */
  scroller?: HTMLElement | null;
  /** 加载中：没有选项时显示骨架行，有选项时顶部显示进度条 */
  loading?: boolean;
  /** 选项的估计高度（px），默认 36；渲染后以实际高度为准 */
  estimateSize?: number;
  /** 自定义选项内容 */
  renderOption?: (option: T, state: OptionRenderState) => VNodeChild;
  /** 没有选项时显示的内容；默认是 Empty（文案取语言包） */
  empty?: VNodeChild;
  /** 点选了一项（Select 据此关闭） */
  onPick?: (value: string) => void;
  /** 选项的部件属性 */
  propsOption?: OptionProps<T>;
  /** 分组标题的部件属性 */
  propsGroupLabel?: Partial<TextProps>;
  /** 已选标记的部件属性 */
  propsCheck?: Partial<IconProps>;
  /** 空状态的部件属性 */
  propsEmpty?: Partial<EmptyProps>;
  /** 加载中占位行的部件属性 */
  propsSkeleton?: Partial<SkeletonProps>;
}

/** 渲染用的一行：分组标题或选项 */
type Row<T> =
  | { kind: 'group'; key: string; label: string; id: string }
  | { kind: 'option'; key: string; option: T; index: number; groupId: string | undefined };

/** 加载中显示几行骨架 */
const SKELETON_ROWS = 4;

/** Listbox 的样式：root、scroll、sizer、row、groupLabel、content 等 */
export const listboxStyles: StyleTable<
  | 'root'
  | 'scroll'
  | 'sizer'
  | 'row'
  | 'groupLabel'
  | 'content'
  | 'description'
  | 'check'
  | 'hidden'
  | 'progress'
  | 'skeleton'
> = stylex.create({
  root: { position: 'relative', padding: '_xs', lineHeight: '_normal', outlineStyle: 'none' },
  // 自己是滚动容器时（单独使用的 Listbox）：限制高度，滚动不传给页面
  scroll: { maxHeight: '20em', overflowY: 'auto', overscrollBehavior: 'contain' },
  sizer: { position: 'relative', width: '_full' },
  row: { position: 'absolute', top: 0, insetInline: 0 },
  groupLabel: {
    display: 'block',
    paddingTop: '_sm',
    paddingBottom: '_xs',
    paddingInline: '_sm',
    fontWeight: '_semibold',
  },
  content: { display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 },
  description: { color: '_textMuted' },
  check: { flexShrink: 0 },
  hidden: { visibility: 'hidden' },
  // 刷新中的进度条贴在列表顶部，不占位
  progress: { position: 'absolute', top: 0, insetInline: 0, zIndex: 1 },
  skeleton: { display: 'block', height: '1em', marginBlock: '0.625em', marginInline: '_sm' },
});

// 行的位置是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Listbox 的样式：y、height、width */
export const listboxPositionStyles: Readonly<{
  y: (px: number) => StyleXStyles;
  height: (px: number) => StyleXStyles;
  width: (percent: string) => StyleXStyles;
}> = stylex.create({
  y: (px: number) => ({ transform: `translateY(${px}px)` }),
  height: (px: number) => ({ height: px }),
  width: (percent: string) => ({ width: percent }),
});

/** 列表的渲染层：虚拟滚动的选项、分组标题、已选标记、空状态与加载中；不管焦点，指针悬停高亮、点击选中 */
export const ListboxView = _component(
  <T extends ListboxOption>({
    list,
    id,
    multiple = false,
    scroller,
    loading = false,
    estimateSize = 36,
    renderOption,
    empty,
    onPick,
    propsOption,
    propsGroupLabel,
    propsCheck,
    propsEmpty,
    propsSkeleton,
    ...rest
  }: ListboxViewProps<T>) => {
    const lang = useLang();
    let root = _state.raw<HTMLElement | null>(null);
    let sizer = _state.raw<HTMLElement | null>(null);

    /** 选项按分组排好后展开成行：每组前插一行标题 */
    const rows = _derived.by<Row<T>[]>(() => {
      const result: Row<T>[] = [];
      let group: string | undefined;
      let headerId: string | undefined;
      list.options.forEach((option, index) => {
        if (option.group != null && option.group !== group) {
          headerId = `${id}-group-${result.length}`;
          result.push({
            kind: 'group',
            key: `group:${option.group}`,
            label: option.group,
            id: headerId,
          });
        }
        group = option.group;
        result.push({
          kind: 'option',
          key: option.value,
          option,
          index,
          groupId: option.group != null ? headerId : undefined,
        });
      });
      return result;
    });

    /** 值 → 行号：高亮项的行号一次查到，不在每次渲染时扫一遍 */
    const rowOf = _derived.by(() => {
      const map = new Map<string, number>();
      rows.forEach((row, index) => {
        if (row.kind === 'option') map.set(row.option.value, index);
      });
      return map;
    });
    const activeRow = () => (list.active === undefined ? -1 : (rowOf.get(list.active) ?? -1));

    const virtual = useVirtualizer(() => {
      const current = rows;
      // 读一下高亮项：它变了要重新算渲染范围（高亮项总要渲染）
      const active = activeRow();
      return {
        count: current.length,
        scrollElement: scroller === undefined ? root : scroller,
        list: sizer,
        estimateSize: (index: number) => (current[index]?.kind === 'group' ? 30 : estimateSize),
        getItemKey: (index: number) => current[index]!.key,
        overscan: 6,
        rangeExtractor: (range) => {
          const indices = defaultRangeExtractor(range);
          if (active >= 0 && !indices.includes(active)) {
            indices.push(active);
            indices.sort((a, b) => a - b);
          }
          return indices;
        },
      };
    });

    // 高亮项变了（键盘移动）时滚进可见范围；已经完整可见就不动（指针悬停触发的不会滚）
    watch(
      () => list.active,
      () => {
        const index = activeRow();
        if (index >= 0) virtual.scrollToIndex(index, { align: 'auto' });
      },
      { flush: 'post' },
    );

    function renderOptionRow(row: Extract<Row<T>, { kind: 'option' }>) {
      const { option, index } = row;
      const state = {
        selected: list.isSelected(option.value),
        active: list.active === option.value,
      };
      const own = typeof propsOption === 'function' ? propsOption(option, state) : propsOption;
      return (
        <div
          {...elementProps(
            mergeProps<'div'>(
              {
                sx: [
                  itemStyles.row,
                  state.active && itemStyles.highlighted,
                  state.selected && itemStyles.selected,
                  option.disabled && itemStyles.disabled,
                ],
              },
              own,
              {
                id: `${id}-${index}`,
                role: 'option',
                'aria-selected': state.selected,
                'aria-disabled': option.disabled || undefined,
                'aria-setsize': list.options.length,
                'aria-posinset': index + 1,
                'aria-describedby': row.groupId,
                // 焦点留在列表、触发按钮或输入框上
                onPointerdown: (event: PointerEvent) => event.preventDefault(),
                onPointermove: () => {
                  if (!option.disabled && list.active !== option.value)
                    list.setActive(option.value);
                },
                onClick: () => {
                  if (option.disabled) return;
                  list.select(option.value);
                  onPick?.(option.value);
                },
              },
            ),
          )}
          data-state={state.selected ? 'checked' : 'unchecked'}
          data-active={state.active || undefined}
          data-disabled={option.disabled || undefined}
        >
          {renderOption ? (
            renderOption(option, state)
          ) : (
            <>
              {option.icon && <Icon icon={option.icon} />}
              <span {...stylex.attrs(listboxStyles.content)}>
                <span {...stylex.attrs(itemStyles.label)}>{option.label}</span>
                {option.description && (
                  <Text size="sm" sx={listboxStyles.description}>
                    {option.description}
                  </Text>
                )}
              </span>
            </>
          )}
          <Icon
            {...mergePartProps<IconProps>(
              { icon: Check, sx: [listboxStyles.check, !state.selected && listboxStyles.hidden] },
              propsCheck,
            )}
          />
        </div>
      );
    }

    function renderBody() {
      if (rows.length === 0) {
        if (loading) {
          return Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton
              key={index}
              {...mergePartProps<SkeletonProps>(
                {
                  sx: [listboxStyles.skeleton, listboxPositionStyles.width(`${85 - index * 15}%`)],
                },
                propsSkeleton,
              )}
            />
          ));
        }
        return (
          empty ?? (
            <Empty
              {...mergePartProps<EmptyProps>(
                { size: 'sm', icon: false, description: lang.selectEmpty },
                propsEmpty,
              )}
            />
          )
        );
      }
      return (
        <div
          ref={_toRef(sizer)}
          role="presentation"
          {...stylex.attrs(listboxStyles.sizer, listboxPositionStyles.height(virtual.total))}
        >
          {virtual.items.map((item) => {
            const row = rows[item.index]!;
            return (
              <div
                key={item.key}
                ref={virtual.measure}
                data-index={item.index}
                role="presentation"
                {...stylex.attrs(listboxStyles.row, listboxPositionStyles.y(item.start))}
              >
                {row.kind === 'group' ? (
                  <Text
                    {...mergePartProps<TextProps>(
                      { tone: 'muted', size: 'sm', sx: listboxStyles.groupLabel },
                      propsGroupLabel,
                      // 只是视觉上的标题：组名经各选项的 aria-describedby 念出
                      { id: row.id, 'aria-hidden': true },
                    )}
                  >
                    {row.label}
                  </Text>
                ) : (
                  renderOptionRow(row)
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return () => (
      <div
        {...elementProps(
          mergeProps<'div'>(
            {
              sx: [
                listboxStyles.root,
                scroller === undefined && listboxStyles.scroll,
                focusRingStyles.visible,
              ],
            },
            rest,
            {
              ref: _toRef(root),
              id,
              role: 'listbox',
              'aria-multiselectable': multiple || undefined,
              'aria-busy': loading || undefined,
            },
          ),
        )}
      >
        {loading && rows.length > 0 && (
          <div aria-hidden="true" {...stylex.attrs(listboxStyles.progress)}>
            <Progress size="xs" aria-label={lang.loading} />
          </div>
        )}
        {renderBody()}
      </div>
    );
  },
  { name: 'ListboxView' },
);

/** 高亮项的 id（给 aria-activedescendant）；没有高亮时 undefined */
export function activeOptionId<T extends ListboxOption>(
  list: ListState<T>,
  id: string,
): string | undefined {
  const index = list.options.findIndex((option) => option.value === list.active);
  return index < 0 ? undefined : `${id}-${index}`;
}

/** 单选：value 是选中项的值 */
interface SingleProps {
  /** 选择方式，默认 single */
  type?: Extract<keyof SelectionModes, 'single'>;
  /** 选中项：父级写 value={_bind(x)} */
  value?: string;
}

/** 多选：value 是选中项的值的数组 */
interface MultipleProps {
  /** 选择方式 */
  type: Extract<keyof SelectionModes, 'multiple'>;
  /** 选中项：父级写 value={_bind(list)} */
  value?: string[];
}

/** 列表框共有的属性；未声明的属性落到 role="listbox" 的 div 上 */
type ListboxBaseProps<T extends ListboxOption> = Omit<
  ListboxViewProps<T>,
  'list' | 'id' | 'multiple' | 'renderOption' | 'onPick'
> & {
  /** 列表的 id；在 Field 里时默认用 Field 给的 */
  id?: string;
  /** 选项 */
  items: readonly T[];
  /** 单选时至少保留一项：再点已选项不取消 */
  required?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 自定义选项内容：`{(option, { selected, active }) => …}` */
  children?: (option: T, state: OptionRenderState) => VNodeChild;
};

/** 单选或多选 */
export type ListboxProps<T extends ListboxOption = ListboxOption> = ListboxBaseProps<T> &
  (SingleProps | MultipleProps);

/** 列表框：焦点在列表上，方向键移动高亮、Enter / 空格选中 */
export const Listbox = _component(
  <T extends ListboxOption>({
    items,
    type = 'single',
    value = _bindable<string | string[] | undefined>(undefined),
    required = false,
    disabled,
    id,
    children,
    ...rest
  }: ListboxProps<T>) => {
    const generatedId = useId();
    const control = useFieldControl(() => ({ id, disabled }));
    const list = useListState({
      options: () => items,
      selected: () => selectedValues(value),
      mode: () => type,
      required: () => required,
      onChange: (next) => (value = type === 'multiple' ? [...next] : next[0]),
    });

    function onKeydown(event: KeyboardEvent) {
      if (control().disabled) return;
      if (handleListKeydown(list, event, { space: true, typeahead: true })) event.preventDefault();
    }

    return () => {
      const state = control();
      const prefix = state.id ?? generatedId;
      return (
        <ListboxView
          {...mergePartProps<ListboxViewProps<T>>(
            { list, id: prefix, multiple: type === 'multiple', renderOption: children },
            rest as Partial<ListboxViewProps<T>>,
            {
              id: prefix,
              tabindex: state.disabled ? -1 : 0,
              'aria-labelledby': rest['aria-labelledby'] ?? state.labelledBy,
              'aria-describedby': state.describedBy,
              'aria-disabled': state.disabled || undefined,
              'aria-activedescendant': activeOptionId(list, prefix),
              onFocus: () => {
                if (list.active === undefined) list.activateDefault();
              },
              onKeydown,
            },
          )}
        />
      );
    };
  },
);
