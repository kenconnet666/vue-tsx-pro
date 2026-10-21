/**
 * 列表框（role="listbox"）：在一列选项里单选或多选。数据驱动，始终虚拟滚动（上万个选项也只渲染看得见的几十个）：
 *
 *   <Listbox items={cities} value={_bind(city)} aria-label="城市" />
 *   <Listbox items={tags} selectionMode="multiple" value={_bind(picked)}>{(tag) => <Badge>{tag.label}</Badge>}</Listbox>
 *   <Listbox items={users} toOption={(user) => ({ value: user.id, label: user.name })} value={_bind(id)} aria-label="成员" />
 *
 * 选项是 { value, label, disabled?, description?, icon?, group? }（ListboxOption）；别的形状的数据用 toOption 转换，
 * 自定义内容的渲染函数拿到的仍是原始数据。
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
import { useId, watch, withMemo, type VNode, type VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { Text, type TextProps } from '../base/Text';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { useLang } from '../config/context';
import { Empty, type EmptyProps } from '../feedback/Empty';
import { Progress } from '../feedback/Progress';
import { Skeleton, type SkeletonProps, type SkeletonShapeProps } from '../feedback/Skeleton';
import { SHIMMER_STAGGER } from '../utils/style/shimmer';
import { itemStyles } from '../utils/style/item-styles';
import {
  defaultLabelledBy,
  elementProps,
  mergeAttrs,
  mergePartProps,
  mergeProps,
  type PartProps,
} from '../utils/props';
import { ScrollArea } from '../layout/ScrollArea';
import { selectedValues, type SelectionProps } from '../utils/data/selection';
import { focusRingStyles } from '../utils/style/styles';
import { useVirtualizer } from '../utils/virtual/use-virtualizer';
import { defaultRangeExtractor } from '../utils/virtual/virtualizer';
import { useFieldControl } from '../form/Field';
import {
  handleListKeydown,
  useListState,
  type ListboxOption,
  type ListStateEntry,
  type ListState,
  type OptionMapping,
  toListboxOption,
} from './list-state';

/** 选项的渲染状态：渲染函数据此画高亮、已选的样子 */
export interface OptionRenderState {
  /** 已选 */
  selected: boolean;
  /** 高亮（键盘或指针所在） */
  active: boolean;
}

/** 选项的部件属性：可以按选项（items 里的原始数据）计算 */
type OptionProps<T> =
  | PartProps<'div', 'role' | 'id' | 'aria-selected' | 'aria-disabled'>
  | ((item: T, state: OptionRenderState) => PartProps<'div'>);

/** ListboxView 的属性：Listbox、Select、Combobox 共用的渲染层 */
export interface ListboxViewProps<T> extends PartProps<'div', 'role'> {
  /** 列表状态（useListState） */
  list: ListState<T>;
  /** 列表的 id；选项的 id 是 `${id}-${序号}`（aria-activedescendant 指向它） */
  id: string;
  /** 多选：aria-multiselectable */
  multiple?: boolean;
  /** 滚动容器：Select、Combobox 的弹出层；不给时列表自己滚动（ScrollArea 的浮层滚动条，最高 20em，用 sx 改） */
  scroller?: HTMLElement | null;
  /** 加载中：没有选项时显示骨架行，有选项时顶部显示进度条 */
  loading?: boolean;
  /** 选项的估计高度（px），默认 36；渲染后以实际高度为准 */
  estimateSize?: number;
  /** 自定义选项内容：拿到 items 里的原始数据 */
  renderOption?: (item: T, state: OptionRenderState) => VNodeChild;
  /** 没有选项时显示的内容；默认是 Empty（文案取语言包） */
  empty?: VNodeChild;
  /** 点选了一项（点击或 Enter，再选已选的那项也会调用）：Select、弹层里的列表据此关闭 */
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
  propsSkeleton?: SkeletonShapeProps;
}

/** 渲染用的一行：分组标题或选项 */
type Row<T> =
  | { kind: 'group'; key: string; label: string; id: string }
  | {
      kind: 'option';
      key: string;
      option: ListStateEntry<T>;
      index: number;
      groupId: string | undefined;
    };

/** 加载中显示几行骨架 */
const SKELETON_ROWS = 4;

/** Listbox 的样式：root、scroll、sizer、row、groupLabel、content 等 */
export const listboxStyles = stylex.create({
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
export const listboxPositionStyles = stylex.create({
  y: (px: number) => ({ transform: `translateY(${px}px)` }),
  height: (px: number) => ({ height: px }),
  width: (percent: string) => ({ width: percent }),
});

/** 列表的渲染层：虚拟滚动的选项、分组标题、已选标记、空状态与加载中；不管焦点，指针悬停高亮、点击选中 */
export const ListboxView = _component(
  <T,>({
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
    // 骨架、进度条防闪烁；aria-busy 按真实的 loading
    const indicator = useDelayedLoading(() => loading);
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
      // 先读出来：每一项都要调用一次估计高度，不要每次都经过 props 的响应式读取
      const size = estimateSize;
      return {
        count: current.length,
        scrollElement: scroller === undefined ? root : scroller,
        list: sizer,
        estimateSize: (index: number) => (current[index]?.kind === 'group' ? 30 : size),
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

    // 高亮项变了（键盘移动）时滚进可见范围；已经完整可见就不动（指针悬停触发的不会滚）。
    // 高亮的是第一项、上面是组名时滚到最顶上：组名不被挡住（搜索过滤后高亮第一个匹配的）
    watch(
      () => list.active,
      () => {
        const index = activeRow();
        if (index < 0) return;
        virtual.scrollToIndex(index === 1 && rows[0]?.kind === 'group' ? 0 : index, {
          align: 'auto',
        });
      },
      { flush: 'post' },
    );

    /**
     * 选项行按“会影响它的值”缓存（Vue 的 withMemo，同模板的 v-memo）：方向键移动高亮时只重建前后两行，
     * 不再重建全部可见行与其中的图标。自定义了 renderOption 或按项计算的 propsOption 时不缓存：
     * 使用方的函数可能读别的状态，缓存了会显示旧内容
     */
    const memoCache: VNode[] = [];
    function optionRow(row: Extract<Row<T>, { kind: 'option' }>) {
      if (renderOption || typeof propsOption === 'function') return renderOptionRow(row);
      const { option } = row;
      return withMemo(
        [
          option,
          row.index,
          row.groupId,
          list.isSelected(option.value),
          list.active === option.value,
          list.options.length,
          propsOption,
          propsCheck,
        ],
        () => renderOptionRow(row),
        memoCache,
        row.index,
      );
    }

    function renderOptionRow(row: Extract<Row<T>, { kind: 'option' }>) {
      const { option, index } = row;
      const state = {
        selected: list.isSelected(option.value),
        active: list.active === option.value,
      };
      const own = typeof propsOption === 'function' ? propsOption(option.item, state) : propsOption;
      return (
        <div
          {...mergeAttrs<'div'>(
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
                if (!option.disabled && list.active !== option.value) list.setActive(option.value);
              },
              onClick: () => {
                if (option.disabled) return;
                list.select(option.value);
                onPick?.(option.value);
              },
            },
          )}
          data-state={state.selected ? 'checked' : 'unchecked'}
          data-active={state.active || undefined}
          data-disabled={option.disabled || undefined}
        >
          {renderOption ? (
            renderOption(option.item, state)
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
          if (!indicator.value) return null;
          return Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton
              key={index}
              {...mergePartProps<SkeletonProps>(
                {
                  sx: [listboxStyles.skeleton, listboxPositionStyles.width(`${85 - index * 15}%`)],
                  delay: index * SHIMMER_STAGGER,
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
                  optionRow(row)
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return () => {
      const own = scroller === undefined;
      // 先不编译 sx：自己滚动时这些属性交给 ScrollArea 的视口，和视口自己的样式一次合并
      const props = mergeProps<'div'>(
        { sx: [listboxStyles.root, own && listboxStyles.scroll, focusRingStyles.visible] },
        rest,
        {
          ref: _toRef(root),
          id,
          role: 'listbox',
          'aria-multiselectable': multiple || undefined,
          'aria-busy': loading || undefined,
        },
      );
      const body = [
        indicator.value && rows.length > 0 && (
          <div aria-hidden="true" {...stylex.attrs(listboxStyles.progress)}>
            <Progress size="xs" aria-label={lang.loading} />
          </div>
        ),
        renderBody(),
      ];
      // 别处滚动（Select、Combobox 的弹出层）：只渲染列表本身
      if (!own) return <div {...elementProps(props)}>{body}</div>;
      // 自己滚动：列表元素就是 ScrollArea 的视口，焦点与 aria-activedescendant 仍在它上面，滚动条换成浮层的
      return (
        <ScrollArea focusable={false} propsViewport={props as PartProps<'div'>}>
          {body}
        </ScrollArea>
      );
    };
  },
  { name: 'ListboxView' },
);

/** 高亮项的 id（给 aria-activedescendant）；没有高亮时 undefined */
export function activeOptionId<T>(list: ListState<T>, id: string): string | undefined {
  const index = list.active === undefined ? -1 : list.indexOf(list.active);
  return index < 0 ? undefined : `${id}-${index}`;
}

/** 列表框共有的属性；未声明的属性落到 role="listbox" 的 div 上 */
export interface ListboxBaseProps<T> extends Omit<
  ListboxViewProps<T>,
  'list' | 'id' | 'multiple' | 'renderOption'
> {
  /** 列表的 id；在 Field 里时默认用 Field 给的 */
  id?: string;
  /** 数据：ListboxOption、字符串，或任意数据加 toOption */
  items: readonly T[];
  /** 必须有选中项：单选时再点已选项不取消；在必填的 Field 里默认开启 */
  required?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 自定义选项内容：`{(item, { selected, active }) => …}`，拿到 items 里的原始数据 */
  children?: (item: T, state: OptionRenderState) => VNodeChild;
}

/** 单选或多选；items 不是 ListboxOption 或字符串时要给 toOption */
export type ListboxProps<T = ListboxOption> = ListboxBaseProps<T> &
  SelectionProps &
  OptionMapping<T>;

/** 列表框：焦点在列表上，方向键移动高亮、Enter / 空格选中 */
export const Listbox = _component(
  <T,>({
    items,
    toOption,
    selectionMode = 'single',
    value = _bindable<string | string[] | null>(null),
    required,
    disabled,
    id,
    children,
    onPick,
    ...rest
  }: ListboxProps<T>) => {
    const generatedId = useId();
    const control = useFieldControl(() => ({ id, disabled, required }));
    const list = useListState({
      items: () => items,
      toOption: (item) => toListboxOption(item, toOption),
      selected: () => selectedValues(value),
      mode: () => selectionMode,
      required: () => control().required,
      onChange: (next) => (value = selectionMode === 'multiple' ? [...next] : (next[0] ?? null)),
    });

    function onKeydown(event: KeyboardEvent) {
      if (control().disabled) return;
      if (handleListKeydown(list, event, { space: true, typeahead: true }, onPick)) {
        event.preventDefault();
      }
    }

    return () => {
      const state = control();
      const prefix = state.id ?? generatedId;
      return (
        <ListboxView
          {...mergePartProps<ListboxViewProps<T>>(
            {
              list,
              id: prefix,
              multiple: selectionMode === 'multiple',
              renderOption: children,
              onPick,
            },
            rest as Partial<ListboxViewProps<T>>,
            {
              id: prefix,
              tabindex: state.disabled ? -1 : 0,
              'aria-labelledby': defaultLabelledBy(rest, state.labelledBy),
              'aria-describedby': state.describedBy,
              'aria-disabled': state.disabled || undefined,
              'aria-required': state.required || undefined,
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
