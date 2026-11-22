/**
 * 列表框（role="listbox"）：在一列选项里单选或多选。数据驱动，始终虚拟滚动（上万个选项也只渲染看得见的几十个）：
 *
 *   <Listbox items={cities} _value={city} aria-label="城市" />
 *   <Listbox items={tags} selectionMode="multiple" _value={picked}>{(tag) => <Badge>{tag.label}</Badge>}</Listbox>
 *   <Listbox items={users} toOption={(user) => ({ value: user.id, label: user.name })} _value={id} aria-label="成员" />
 *
 * 选项是 { value, label, disabled?, description?, icon?, group? }（ListboxOption）；别的形状的数据用 toOption 转换，
 * 自定义内容的渲染函数拿到的仍是原始数据。
 * 焦点在列表上，高亮项经 aria-activedescendant 告诉读屏：↑↓、Home / End、Page Up / Down 移动，
 * Enter / 空格选中，按字母跳到以它开头的项。状态与键盘见 list-state.ts；Select、Combobox 用同一个 ListboxView 渲染。
 *
 * 虚拟滚动（useVirtualizer）：高亮项总在渲染范围里（aria-activedescendant 才指得到），键盘移动时滚进可见范围；
 * 选项带 aria-setsize / aria-posinset，读屏知道总数与位置。分组标题只是视觉上的一行（各行独立定位，没法用
 * role="group" 包住组里的选项），组名经 aria-describedby 交给组里的每个选项。
 * loading：选项换成骨架行（首次加载与刷新一样，不再另加进度条）；'more'（远程分页取下一页）时骨架接在已有的选项后面；列表带 aria-busy。
 *
 * layout="grid" 排成网格（缩略图、图标、颜色、材质这类按图挑的）：每格的宽度不小于 minItemWidth，放得下几列排几列（或固定
 * columns 列），←→ 前后一项、↑↓ 上下一行的同一列，分组的第一项另起一行；照样按行虚拟滚动。
 *
 *   <Listbox items={materials} layout="grid" minItemWidth="6em" _value={material} aria-label="材质">
 *     {(material) => <><Image src={material.thumbnail} alt="" /><Small>{material.name}</Small></>}
 *   </Listbox>
 *
 * 部件：Root（div，role="listbox"）、GroupLabel、Cells（网格的一行）、Option（div，role="option"）、Check（已选标记）、Skeleton（加载中的占位行）。
 */
import { Check } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, watch, withMemo, type VNode, type VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { Text, type TextProps } from '../base/Text';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { useLang } from '../config/context';
import { partAttrs } from '../config/styles';
import { Empty, type EmptyProps } from '../feedback/Empty';
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
import { defaultRangeExtractor, type VisibleRange } from '../utils/virtual/virtualizer';
import { useFieldControl } from '../form/Field';
import { t } from '../config/theme/tokens';
import {
  gridRows,
  handleGridKeydown,
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

/** 选项的排法 */
export interface ListboxLayouts {
  /** 一行一项（默认） */
  list: unknown;
  /** 排成网格：缩略图、图标、颜色、材质这类按图挑的；←→ 前后一项，↑↓ 上下一行 */
  grid: unknown;
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
  /** 加载中：true 时选项换成骨架行；'more'（远程分页取下一页）时已有的选项留着，骨架接在末尾 */
  loading?: boolean | 'more';
  /** 可见范围变化（行号含分组标题）：远程分页时接近末尾取下一页 */
  onRangeChange?: (range: VisibleRange) => void;
  /** 选项（网格时是一行）的估计高度（px），默认一行一项时 36、网格时 96；渲染后以实际高度为准 */
  estimateSize?: number;
  /** 排法，默认 list */
  layout?: keyof ListboxLayouts;
  /** 网格时固定几列；不写时按 minItemWidth 放得下几列排几列 */
  columns?: number;
  /** 网格时每格的最小宽度（CSS 长度），默认 `'6em'` */
  minItemWidth?: string;
  /** 网格实际排成了几列（容器变宽变窄时跟着变）：管键盘的一方据此让 ↑↓ 跨一行 */
  onColumnsChange?: (columns: number) => void;
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

/** 一个选项和它的位置 */
interface OptionRow<T> {
  kind: 'option';
  key: string;
  option: ListStateEntry<T>;
  index: number;
  groupId: string | undefined;
}

/** 渲染用的一行：分组标题、选项，或网格的一行选项 */
type Row<T> =
  | { kind: 'group'; key: string; label: string; id: string }
  | OptionRow<T>
  | { kind: 'cells'; key: string; cells: OptionRow<T>[] };

/** 加载中显示几行骨架：没有选项时铺几行，远程分页取下一页时接在末尾几行 */
const SKELETON_ROWS = 4;
const MORE_SKELETON_ROWS = 2;

/** 部件的标记（data-scope="listbox"）：使用方的全局样式能选中它们，也让它们和别的部件一样 border-box */
const listboxPart = (part: string) => partAttrs({ name: 'Listbox' }, part);

/** Listbox 的样式：root、scroll、sizer、row、groupLabel、content 等 */
const listboxStyles = css.create({
  root: { position: 'relative', padding: '_xs', lineHeight: '_normal', outlineStyle: 'none' },
  // 自己是滚动容器时（单独使用的 Listbox）：限制高度，滚动不传给页面
  scroll: { maxHeight: '20em', overflowY: 'auto', overscrollBehavior: 'contain' },
  // 各行叠在同一格里、按 translateY 错开（不用绝对定位）：行还在文档流里，弹层按最宽的一行定宽，
  // 选项文字不会被触发框的宽度截断；放不下时（弹层有上限）照旧省略
  sizer: {
    position: 'relative',
    width: '_full',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    alignItems: 'start',
  },
  row: { gridArea: '1 / 1', minWidth: 0 },
  groupLabel: {
    display: 'block',
    paddingTop: '_sm',
    paddingBottom: '_xs',
    paddingInline: '_sm',
    fontWeight: '_medium',
  },
  content: { display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 },
  description: { color: '_textMuted' },
  check: { flexShrink: 0 },
  hidden: { visibility: 'hidden' },
  skeleton: { display: 'block', height: '1em', marginBlock: '0.625em', marginInline: '_sm' },
  // 网格的一行：各格等宽；行和行之间留出和列之间一样的空
  cells: { display: 'grid', gap: '_xs', paddingBlockEnd: '_xs' },
  // 网格的一格：内容竖排居中（缩略图在上、名字在下），已选的描一圈品牌色（和高亮的底色叠在一起也分得清）
  tile: {
    flexDirection: 'column',
    // 从上排起：名字折成两行的那一格，缩略图也和同一行的对齐
    justifyContent: 'flex-start',
    gap: '_xs',
    paddingInline: '_xs',
    textAlign: 'center',
    minWidth: 0,
    boxShadow: { default: null, _selected: `inset 0 0 0 ${t.borderWidths.sm} ${t.colors.accent}` },
  },
  // 量网格放得下几列：和网格的一行同样的列定义，看浏览器排出几条轨道
  probe: { height: 0, overflow: 'hidden', visibility: 'hidden' },
});

// 行的位置是任意值，用动态样式；单独一个 create，见 COMPONENTS.md §4
/** Listbox 的样式：y、height、width */
const listboxPositionStyles = css.create({
  y: (px: number) => ({ transform: `translateY(${px}px)` }),
  height: (px: number) => ({ height: px }),
  width: (percent: string) => ({ width: percent }),
  columns: (count: number) => ({ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }),
  autoFill: (minWidth: string) => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(min(${minWidth}, 100%), 1fr))`,
  }),
});

/** 列表的渲染层：虚拟滚动的选项、分组标题、已选标记、空状态与加载中；不管焦点，指针悬停高亮、点击选中 */
export const ListboxView = _component(
  <T,>({
    list,
    id,
    multiple = false,
    scroller,
    loading = false,
    onRangeChange,
    estimateSize,
    layout = 'list',
    columns: fixedColumns,
    minItemWidth = '6em',
    onColumnsChange,
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
    // 骨架防闪烁；aria-busy 按真实的 loading
    const indicator = useDelayedLoading(() => loading !== false);
    let root = _state.raw<HTMLElement | null>(null);
    let sizer = _state.raw<HTMLElement | null>(null);
    let probe = _state.raw<HTMLElement | null>(null);
    const grid = () => layout === 'grid';

    /** 网格按宽度排了几列：量一行同样列定义的探针，看浏览器排出几条轨道（列宽是 em、容器在变时都对） */
    let measuredColumns = _state(1);
    _effect(() => {
      const element = probe;
      if (!grid() || fixedColumns !== undefined || !element) return undefined;
      const update = () => {
        const tracks = getComputedStyle(element).gridTemplateColumns.trim();
        // 没排版（测试环境）时拿到的是原样的 repeat(…)：当一列
        const count = tracks.startsWith('repeat') ? 1 : tracks.split(/\s+/).filter(Boolean).length;
        if (count > 0 && count !== measuredColumns) measuredColumns = count;
      };
      const observer = new ResizeObserver(update);
      observer.observe(element);
      update();
      return () => observer.disconnect();
    });
    const columnCount = () => (grid() ? Math.max(1, fixedColumns ?? measuredColumns) : 1);
    watch(columnCount, (count) => onColumnsChange?.(count), { immediate: true });

    /** 选项按分组排好后展开成行：每组前插一行标题；网格时同一组的选项每 columns 个一行 */
    const rows = _derived.by<Row<T>[]>(() => {
      const result: Row<T>[] = [];
      if (grid()) {
        let group: string | undefined;
        let headerId: string | undefined;
        let index = 0;
        for (const cells of gridRows(list.options, columnCount())) {
          const first = cells[0]!;
          if (first.group != null && first.group !== group) {
            headerId = `${id}-group-${result.length}`;
            result.push({
              kind: 'group',
              key: `group:${first.group}`,
              label: first.group,
              id: headerId,
            });
          }
          group = first.group;
          result.push({
            kind: 'cells',
            key: `cells:${first.value}`,
            cells: cells.map((option) => ({
              kind: 'option',
              key: option.value,
              option,
              index: index++,
              groupId: option.group != null ? headerId : undefined,
            })),
          });
        }
        return result;
      }
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
        if (row.kind === 'cells') for (const cell of row.cells) map.set(cell.option.value, index);
      });
      return map;
    });
    const activeRow = () => (list.active === undefined ? -1 : (rowOf.get(list.active) ?? -1));

    const virtual = useVirtualizer(() => {
      const current = rows;
      // 读一下高亮项：它变了要重新算渲染范围（高亮项总要渲染）
      const active = activeRow();
      // 先读出来：每一项都要调用一次估计高度，不要每次都经过 props 的响应式读取
      const size = estimateSize ?? (grid() ? 96 : 36);
      return {
        count: current.length,
        scrollElement: scroller === undefined ? root : scroller,
        list: sizer,
        estimateSize: (index: number) => (current[index]?.kind === 'group' ? 30 : size),
        getItemKey: (index: number) => current[index]!.key,
        overscan: 6,
        onRangeChange,
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
    function optionRow(row: OptionRow<T>) {
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
          layout,
        ],
        () => renderOptionRow(row),
        memoCache,
        row.index,
      );
    }

    function renderOptionRow(row: OptionRow<T>) {
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
              sx: [itemStyles.row, itemStyles.states, grid() && listboxStyles.tile],
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
          data-highlighted={state.active || undefined}
          data-disabled={option.disabled || undefined}
        >
          {renderOption ? (
            renderOption(option.item, state)
          ) : (
            <>
              {option.icon && <Icon icon={option.icon} />}
              <span {...css.attrs(listboxStyles.content)} {...listboxPart('content')}>
                <span {...css.attrs(itemStyles.label)}>{option.label}</span>
                {option.description && (
                  <Text size="sm" sx={listboxStyles.description}>
                    {option.description}
                  </Text>
                )}
              </span>
            </>
          )}
          {/* 网格里已选的是一圈描边，不另画勾 */}
          {!grid() && (
            <Icon
              {...mergePartProps<IconProps>(
                { icon: Check, sx: [listboxStyles.check, !state.selected && listboxStyles.hidden] },
                propsCheck,
              )}
            />
          )}
        </div>
      );
    }

    const skeletonRows = (count: number) =>
      Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={`skeleton-${index}`}
          {...mergePartProps<SkeletonProps>(
            {
              sx: [listboxStyles.skeleton, listboxPositionStyles.width(`${85 - index * 15}%`)],
              delay: index * SHIMMER_STAGGER,
            },
            propsSkeleton,
          )}
        />
      ));

    // 骨架在加载结束后还会多留一会儿（防闪烁）：这期间按最后一次加载的方式（换掉选项还是接在末尾）显示
    let lastLoading: true | 'more' = true;

    function renderBody() {
      if (loading !== false) lastLoading = loading;
      // 远程分页取下一页：已有的选项留着，骨架接在末尾
      const appending = lastLoading === 'more' && rows.length > 0;
      if (indicator.value && !appending) return skeletonRows(SKELETON_ROWS);
      if (rows.length === 0) {
        // 加载刚开始、骨架还没到显示的时候（防闪烁）：先空着
        if (loading) return null;
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
      const options = (
        <div
          key="options"
          ref={_toRef(sizer)}
          role="presentation"
          {...css.attrs(listboxStyles.sizer, listboxPositionStyles.height(virtual.total))}
          {...listboxPart('sizer')}
        >
          {virtual.items.map((item) => {
            const row = rows[item.index]!;
            return (
              <div
                key={item.key}
                ref={virtual.measure}
                data-index={item.index}
                role="presentation"
                {...css.attrs(listboxStyles.row, listboxPositionStyles.y(item.start))}
                {...listboxPart('row')}
              >
                {row.kind === 'cells' ? (
                  <div
                    role="presentation"
                    {...css.attrs(
                      listboxStyles.cells,
                      listboxPositionStyles.columns(columnCount()),
                    )}
                    {...listboxPart('cells')}
                  >
                    {row.cells.map(optionRow)}
                  </div>
                ) : row.kind === 'group' ? (
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
      const body = indicator.value ? [options, ...skeletonRows(MORE_SKELETON_ROWS)] : [options];
      if (!grid() || fixedColumns !== undefined) return body;
      const measure = (
        <div
          key="probe"
          ref={_toRef(probe)}
          aria-hidden="true"
          {...css.attrs(
            listboxStyles.cells,
            listboxStyles.probe,
            listboxPositionStyles.autoFill(minItemWidth),
          )}
        />
      );
      return [measure, ...body];
    }

    return () => {
      const own = scroller === undefined;
      // 先不编译 sx：自己滚动时这些属性交给 ScrollArea 的视口，和视口自己的样式一次合并
      const props = mergeProps<'div'>(
        {
          ...listboxPart('root'),
          // 自己滚动时它就是滚动区域的视口，外面一圈会被滚动区域裁掉：焦点环画在里面
          sx: [
            listboxStyles.root,
            own && listboxStyles.scroll,
            own ? focusRingStyles.inset : focusRingStyles.visible,
          ],
        },
        rest,
        {
          ref: _toRef(root),
          id,
          role: 'listbox',
          'aria-multiselectable': multiple || undefined,
          'aria-busy': loading !== false || undefined,
        },
      );
      const body = renderBody();
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
  // aria-readonly 跟着 readonly（与所在的 Field、Form）走
  'list' | 'id' | 'multiple' | 'renderOption' | 'aria-readonly'
> {
  /** 列表的 id；在 Field 里时默认用 Field 给的 */
  id?: string;
  /** 数据：ListboxOption、字符串，或任意数据加 toOption */
  items: readonly T[];
  /** 必须有选中项：单选时再点已选项不取消；在必填的 Field 里默认开启 */
  required?: boolean;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：能聚焦、看得到选中项，不能改（查看详情、审批时） */
  readonly?: boolean;
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
    _value: value = _bindable<string | string[] | null>(null),
    required,
    disabled,
    readonly,
    id,
    children,
    onPick,
    ...rest
  }: ListboxProps<T>) => {
    const generatedId = useId();
    const control = useFieldControl(() => ({ id, disabled, readonly, required }));
    const list = useListState({
      items: () => items,
      toOption: (item) => toListboxOption(item, toOption),
      selected: () => selectedValues(value),
      mode: () => selectionMode,
      required: () => control().required,
      // 不可用时哪条路（点击、键盘）都不改值
      onChange: (next) => {
        if (control().disabled || control().readonly) return;
        value = selectionMode === 'multiple' ? [...next] : (next[0] ?? null);
      },
    });

    /** 网格实际排了几列（ListboxView 量出来的）：↑↓ 跨一行 */
    let columns = 1;
    function onKeydown(event: KeyboardEvent) {
      if (control().disabled) return;
      if (rest.layout === 'grid' && handleGridKeydown(list, event, columns)) {
        event.preventDefault();
        return;
      }
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
              onPick: state.disabled || state.readonly ? undefined : onPick,
              onColumnsChange: (count: number) => (columns = count),
            },
            rest as Partial<ListboxViewProps<T>>,
            {
              id: prefix,
              tabindex: state.disabled ? -1 : 0,
              'aria-labelledby': defaultLabelledBy(rest, state.labelledBy),
              'aria-describedby': state.describedBy,
              'aria-disabled': state.disabled || undefined,
              'aria-readonly': state.readonly || undefined,
              'aria-required': state.required || undefined,
              'aria-activedescendant': activeOptionId(list, prefix),
              onFocus: () => {
                if (list.active === undefined) list.activateDefault();
              },
              // 选项按下时阻止了默认的聚焦（弹层里焦点要留在触发按钮、输入框上）；单独用的列表框点了要拿到焦点，之后方向键才管用
              onPointerdown: (event: PointerEvent) => {
                if (!state.disabled)
                  (event.currentTarget as HTMLElement).focus({ preventScroll: true });
              },
              onKeydown,
            },
          )}
        />
      );
    };
  },
);
