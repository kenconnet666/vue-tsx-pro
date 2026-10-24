/**
 * 穿梭框：左边是可选的，右边是已选的，勾上之后点中间的按钮移过去（分配权限、指派成员、挑选导出的列）。
 *
 *   <Transfer items={users} toOption={(user) => ({ value: user.id, label: user.name })} value={_bind(memberIds)} searchable />
 *   <TreeTransfer items={orgs} getKey={…} getLabel={…} getChildren={…} value={_bind(teamIds)} />   左边是一棵树
 *
 * - 每一边是一个可多选的 Listbox（焦点、方向键、空格勾选、虚拟滚动同 Listbox），上方是全选框、标题与“勾上 / 总数”，
 *   searchable 时带搜索框（按选项文字，认 createUi 的 textMatcher）。全选只管当前看得见（搜索后留下）的项。
 * - 中间两个按钮把勾上的项移到另一边（没有勾上的时不可用），双击一项直接移过去；移动后读屏播报移了几项。
 *   不可用的选项（ListboxOption 的 disabled）勾不上，也就移不动。
 * - value 是右边的值，按移过去的先后排列；items 里找不到的值不显示（也不会被删掉）。
 * - TreeTransfer：左边是勾选的 Tree（父子联动、可搜索），已经移过去的节点勾上且不可用；只移叶子，value 是叶子的 key。
 * - 在 Field 里时整体是一组（role="group"，名称是 Field 的标签），两边的列表各以自己的标题为名。
 *
 * 部件：Root（div，role="group"）、Panel（section，每一边）、Header、SelectAll（Checkbox）、Title、Count、
 * Search（TextField）、List（Listbox / Tree）、Actions（中间的按钮）。
 */
import { ChevronLeft, ChevronRight, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { useId, type VNodeChild } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { Small } from '../base/Text';
import { useLang, useTextMatcher } from '../config/context';
import { Tree, type TreeProps } from '../display/Tree';
import { useFieldControl } from '../form/Field';
import { checkedByStrategy, indexTree } from '../utils/data/tree';
import { announce } from '../utils/dom/announcer';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Checkbox } from './Checkbox';
import { Listbox, type ListboxBaseProps } from './Listbox';
import type { MultipleSelectionProps } from '../utils/data/selection';
import { toListboxOption, type ListboxOption, type OptionMapping } from './list-state';
import { TextField, type TextFieldProps } from './TextField';

/** 两边的列表（可多选的 Listbox）的属性：propsList 用它 */
export type TransferListProps<T> = ListboxBaseProps<T> & MultipleSelectionProps & OptionMapping<T>;

/** Transfer 与 TreeTransfer 共有的属性；未声明的属性落到外层 div（role="group"）上 */
export interface TransferBaseProps extends PartProps<'div', 'role'> {
  /** 右边（已选）的值，按移过去的先后排列：父级写 value={_bind(keys)} */
  value?: string[];
  /** 左右两边的标题，默认取语言包（可选、已选） */
  titles?: readonly [string, string];
  /** 两边带搜索框 */
  searchable?: boolean;
  /** 不可用：勾不了、移不了 */
  disabled?: boolean;
  /** 每一边的部件属性（section；列表的高度给它的 sx） */
  propsPanel?: PartProps<'section'>;
  /** 搜索框的部件属性 */
  propsSearch?: Partial<TextFieldProps>;
  /** 中间两个按钮的部件属性 */
  propsAction?: Partial<IconButtonProps>;
}

/** 选项是 ListboxOption、字符串，或任意数据加 toOption */
export type TransferProps<T = ListboxOption> = TransferBaseProps &
  OptionMapping<T> & {
    /** 全部数据（两边一起）：右边显示 value 里的那些 */
    items: readonly T[];
    /** 搜索时怎样算匹配；默认选项文字包含输入（忽略大小写与重音，或 createUi 的 textMatcher） */
    filter?: (item: T, query: string) => boolean;
    /** 两边列表的部件属性 */
    propsList?: Partial<TransferListProps<T>>;
  };

/** 左边是一棵树的穿梭框 */
export interface TreeTransferProps<T> extends TransferBaseProps {
  /** 第一层的节点 */
  items: readonly T[];
  /** 节点的 key，整棵树里唯一 */
  getKey: (node: T) => string;
  /** 节点的文字 */
  getLabel: (node: T) => string;
  /** 子节点 */
  getChildren: (node: T) => readonly T[] | undefined;
  /** 左边的树的部件属性 */
  propsTree?: Partial<TreeProps<T>>;
  /** 右边列表的部件属性 */
  propsList?: Partial<TransferListProps<ListboxOption>>;
}

/** Transfer 的样式：root、panel、header、title、search、list、actions、actionIcon */
export const transferStyles = css.create({
  // 窄屏时上下排，按钮换成上下箭头
  root: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr) auto minmax(0, 1fr)',
      '@media (max-width: 40rem)': 'minmax(0, 1fr)',
    },
    alignItems: 'stretch',
    gap: '_md',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    height: '20em',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    backgroundColor: '_surface',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
  },
  title: { flexGrow: 1, minWidth: 0, fontWeight: '_semibold' },
  search: { padding: '_xs', flexShrink: 0 },
  searchField: { width: '_full' },
  // 列表占满剩下的高度，自己滚动（虚拟滚动要有确定的高度）
  list: { flexGrow: 1, minHeight: 0, borderWidth: 0, borderRadius: 0 },
  actions: {
    display: 'flex',
    flexDirection: { default: 'column', '@media (max-width: 40rem)': 'row' },
    justifyContent: 'center',
    gap: '_sm',
  },
  actionIcon: { rotate: { default: null, '@media (max-width: 40rem)': '90deg' } },
});

interface PanelOptions {
  title: string;
  titleId: string;
  /** 看得见的、能勾的项 */
  selectable: readonly string[];
  /** 勾上的 */
  checked: readonly string[];
  /** 这一边一共几项 */
  total: number;
  onCheckAll: (keys: string[]) => void;
  search: string;
  onSearch: (text: string) => void;
  searchable: boolean;
  disabled: boolean;
  propsPanel?: PartProps<'section'>;
  propsSearch?: Partial<TextFieldProps>;
  list: VNodeChild;
}

/** 一边：全选框、标题、计数、搜索框与列表 */
function renderPanel(lang: ReturnType<typeof useLang>, options: PanelOptions) {
  const visibleChecked = options.selectable.filter((key) => options.checked.includes(key));
  const all = options.selectable.length > 0 && visibleChecked.length === options.selectable.length;
  return (
    <section
      {...mergeAttrs<'section'>({ sx: transferStyles.panel }, options.propsPanel, {
        'aria-labelledby': options.titleId,
      })}
    >
      <div {...css.attrs(transferStyles.header)}>
        <Checkbox
          checked={_bind(
            () => all,
            (next: boolean) => {
              const others = options.checked.filter((key) => !options.selectable.includes(key));
              options.onCheckAll(next ? [...others, ...options.selectable] : others);
            },
          )}
          indeterminate={!all && visibleChecked.length > 0}
          disabled={options.disabled || options.selectable.length === 0}
          aria-label={lang.transferSelectAll(options.title)}
        />
        <span id={options.titleId} {...css.attrs(transferStyles.title)}>
          {options.title}
        </span>
        <Small tone="muted">{lang.transferCount(options.checked.length, options.total)}</Small>
      </div>
      {options.searchable && (
        <div {...css.attrs(transferStyles.search)}>
          <TextField
            {...mergePartProps<TextFieldProps>(
              {
                icon: Search,
                variant: 'soft',
                size: 'sm',
                placeholder: lang.selectSearch,
                'aria-label': `${lang.selectSearch} ${options.title}`,
                propsRoot: { sx: transferStyles.searchField },
              },
              options.propsSearch,
            )}
            type="search"
            value={_bind(() => options.search, options.onSearch)}
            disabled={options.disabled}
          />
        </div>
      )}
      {options.list}
    </section>
  );
}

/** 中间的两个按钮 */
function renderActions(
  lang: ReturnType<typeof useLang>,
  titles: readonly [string, string],
  enabled: readonly [boolean, boolean],
  move: readonly [() => void, () => void],
  propsAction: Partial<IconButtonProps> | undefined,
) {
  return (
    <div {...css.attrs(transferStyles.actions)}>
      {([1, 0] as const).map((to) => (
        <IconButton
          key={to}
          {...mergePartProps<IconButtonProps>(
            {
              icon: to === 1 ? ChevronRight : ChevronLeft,
              'aria-label': lang.transferMoveTo(titles[to]),
              variant: 'soft',
              size: 'sm',
              propsIcon: { flipInRtl: true, sx: transferStyles.actionIcon },
            },
            propsAction,
            { disabled: !enabled[to], onClick: move[to] },
          )}
        />
      ))}
    </div>
  );
}

/** 穿梭框：两个可多选的列表，勾上之后移到另一边 */
export const Transfer = _component(
  <T,>({
    items,
    toOption,
    value = _bindable<string[]>([]),
    titles,
    searchable = false,
    filter,
    disabled,
    propsPanel,
    propsSearch,
    propsAction,
    propsList,
    ...rest
  }: TransferProps<T>) => {
    const lang = useLang();
    const textMatcher = useTextMatcher();
    const field = useFieldControl(() => ({ disabled }));
    const baseId = useId();
    let checked = _state<[string[], string[]]>([[], []]);
    let searches = _state<[string, string]>(['', '']);

    const entries = _derived.by(() =>
      items.map((item) => ({ item, option: toListboxOption(item, toOption) })),
    );
    const byValue = _derived.by(() => new Map(entries.map((entry) => [entry.option.value, entry])));
    const chosen = _derived.by(() => new Set(value));
    const titleOf = (side: 0 | 1) =>
      titles?.[side] ?? (side === 0 ? lang.transferSource : lang.transferTarget);

    const matches = (entry: (typeof entries)[number], query: string) => {
      const text = query.trim();
      if (!text) return true;
      return filter ? filter(entry.item, text) : textMatcher()(entry.option.label, text);
    };
    /** 一边的全部项（左边按 items 的顺序，右边按移过去的先后） */
    const sideEntries = (side: 0 | 1) =>
      side === 0
        ? entries.filter((entry) => !chosen.has(entry.option.value))
        : value.flatMap((key) => byValue.get(key) ?? []);
    const shownEntries = (side: 0 | 1) =>
      sideEntries(side).filter((entry) => matches(entry, searches[side]));

    function setChecked(side: 0 | 1, keys: string[]) {
      checked = side === 0 ? [keys, checked[1]] : [checked[0], keys];
    }

    /** 把 keys 从 from 这一边移到另一边 */
    function move(from: 0 | 1, keys: readonly string[]) {
      const movable = keys.filter((key) => {
        const entry = byValue.get(key);
        return entry && !entry.option.disabled && chosen.has(key) === (from === 1);
      });
      if (field().disabled || movable.length === 0) return;
      const moving = new Set(movable);
      value = from === 0 ? [...value, ...movable] : value.filter((key) => !moving.has(key));
      setChecked(
        from,
        checked[from].filter((key) => !moving.has(key)),
      );
      announce(lang.transferMoved(movable.length, titleOf(from === 0 ? 1 : 0)));
    }

    return () => {
      const state = field();
      const list = (side: 0 | 1) => (
        <Listbox
          {...mergePartProps<TransferListProps<T>>(
            {
              items: shownEntries(side).map((entry) => entry.item),
              toOption: (item: T) => toListboxOption(item, toOption),
              selectionMode: 'multiple',
              sx: transferStyles.list,
              propsOption: (item: T) => ({
                // 双击直接移过去
                onDblclick: () => move(side, [toListboxOption(item, toOption).value]),
              }),
            } as TransferListProps<T>,
            propsList,
            {
              disabled: state.disabled,
              id: `${baseId}-${side}`,
              'aria-labelledby': `${baseId}-title-${side}`,
            } as Partial<TransferListProps<T>>,
          )}
          value={_bind(
            () => checked[side],
            (next: string[]) => setChecked(side, next),
          )}
        />
      );
      const panel = (side: 0 | 1) =>
        renderPanel(lang, {
          title: titleOf(side),
          titleId: `${baseId}-title-${side}`,
          selectable: shownEntries(side)
            .filter((entry) => !entry.option.disabled)
            .map((entry) => entry.option.value),
          checked: checked[side],
          total: sideEntries(side).length,
          onCheckAll: (keys) => setChecked(side, keys),
          search: searches[side],
          onSearch: (text) => (searches = side === 0 ? [text, searches[1]] : [searches[0], text]),
          searchable,
          disabled: state.disabled,
          propsPanel,
          propsSearch,
          list: list(side),
        });
      return (
        <div
          {...mergeAttrs<'div'>({ sx: transferStyles.root }, rest, {
            role: 'group',
            'aria-labelledby': rest['aria-labelledby'] ?? state.labelledBy,
            'aria-describedby': state.describedBy,
          })}
        >
          {panel(0)}
          {renderActions(
            lang,
            [titleOf(0), titleOf(1)],
            [!state.disabled && checked[1].length > 0, !state.disabled && checked[0].length > 0],
            [() => move(1, checked[1]), () => move(0, checked[0])],
            propsAction,
          )}
          {panel(1)}
        </div>
      );
    };
  },
);

/** 左边是一棵树的穿梭框：勾选叶子（父子联动）移到右边 */
export const TreeTransfer = _component(
  <T,>({
    items,
    getKey,
    getLabel,
    getChildren,
    value = _bindable<string[]>([]),
    titles,
    searchable = false,
    disabled,
    propsPanel,
    propsSearch,
    propsAction,
    propsTree,
    propsList,
    ...rest
  }: TreeTransferProps<T>) => {
    const lang = useLang();
    const textMatcher = useTextMatcher();
    const field = useFieldControl(() => ({ disabled }));
    const baseId = useId();
    let checked = _state<[string[], string[]]>([[], []]);
    let searches = _state<[string, string]>(['', '']);
    let expanded = _state<string[]>([]);

    const index = _derived.by(() =>
      indexTree(items, { getKey: (node) => getKey(node), getChildren }),
    );
    // key → 节点：右边的文字、左边“不可用”的判断都用它
    const nodes = _derived.by(() => {
      const map = new Map<string, T>();
      const visit = (level: readonly T[]) =>
        level.forEach((node) => {
          map.set(getKey(node), node);
          visit(getChildren(node) ?? []);
        });
      visit(items);
      return map;
    });
    const leaves = _derived.by(() => index.order.filter((key) => !index.children.get(key)?.length));
    const chosen = _derived.by(() => new Set(value));
    const titleOf = (side: 0 | 1) =>
      titles?.[side] ?? (side === 0 ? lang.transferSource : lang.transferTarget);
    const matchesSearch = (key: string, side: 0 | 1) => {
      const text = searches[side].trim();
      const node = nodes.get(key);
      return !text || (!!node && textMatcher()(getLabel(node), text));
    };
    // 左边能勾的叶子：还没移过去的（搜索时只算匹配的）
    const sourceLeaves = () => leaves.filter((key) => !chosen.has(key));
    const targetOptions = () =>
      value.flatMap((key) => {
        const node = nodes.get(key);
        return node ? [{ value: key, label: getLabel(node) }] : [];
      });

    function setChecked(side: 0 | 1, keys: string[]) {
      checked = side === 0 ? [keys, checked[1]] : [checked[0], keys];
    }

    function move(from: 0 | 1, keys: readonly string[]) {
      const movable = keys.filter((key) => nodes.has(key) && chosen.has(key) === (from === 1));
      if (field().disabled || movable.length === 0) return;
      const moving = new Set(movable);
      value = from === 0 ? [...value, ...movable] : value.filter((key) => !moving.has(key));
      setChecked(
        from,
        checked[from].filter((key) => !moving.has(key)),
      );
      announce(lang.transferMoved(movable.length, titleOf(from === 0 ? 1 : 0)));
    }

    return () => {
      const state = field();
      const sourceChecked = checked[0];
      const tree = (
        <Tree
          {...mergePartProps<TreeProps<T>>(
            {
              items,
              getKey,
              getLabel,
              getChildren,
              checkable: true,
              // 已经移过去的叶子勾上且不可用
              isDisabled: (node: T) => state.disabled || chosen.has(getKey(node)),
              filter: searches[0],
              propsScrollArea: { sx: transferStyles.list },
            },
            propsTree,
            { 'aria-labelledby': `${baseId}-title-0` },
          )}
          checked={_bind(
            () => [...value, ...sourceChecked],
            (next: string[]) =>
              setChecked(
                0,
                checkedByStrategy(index, next, 'child').filter((key) => !chosen.has(key)),
              ),
          )}
          expanded={_bind(expanded)}
        />
      );
      const list = (
        <Listbox
          {...mergePartProps<TransferListProps<ListboxOption>>(
            {
              items: targetOptions().filter((option) => matchesSearch(option.value, 1)),
              selectionMode: 'multiple',
              sx: transferStyles.list,
              propsOption: (option: ListboxOption) => ({
                onDblclick: () => move(1, [option.value]),
              }),
            } as TransferListProps<ListboxOption>,
            propsList,
            {
              disabled: state.disabled,
              id: `${baseId}-1`,
              'aria-labelledby': `${baseId}-title-1`,
            } as Partial<TransferListProps<ListboxOption>>,
          )}
          value={_bind(
            () => checked[1],
            (next: string[]) => setChecked(1, next),
          )}
        />
      );
      const panel = (side: 0 | 1, selectable: string[], total: number, body: VNodeChild) =>
        renderPanel(lang, {
          title: titleOf(side),
          titleId: `${baseId}-title-${side}`,
          selectable,
          checked: checked[side],
          total,
          onCheckAll: (keys) => setChecked(side, keys),
          search: searches[side],
          onSearch: (text) => (searches = side === 0 ? [text, searches[1]] : [searches[0], text]),
          searchable,
          disabled: state.disabled,
          propsPanel,
          propsSearch,
          list: body,
        });
      return (
        <div
          {...mergeAttrs<'div'>({ sx: transferStyles.root }, rest, {
            role: 'group',
            'aria-labelledby': rest['aria-labelledby'] ?? state.labelledBy,
            'aria-describedby': state.describedBy,
          })}
        >
          {panel(
            0,
            sourceLeaves().filter((key) => matchesSearch(key, 0)),
            sourceLeaves().length,
            tree,
          )}
          {renderActions(
            lang,
            [titleOf(0), titleOf(1)],
            [!state.disabled && checked[1].length > 0, !state.disabled && sourceChecked.length > 0],
            [() => move(1, checked[1]), () => move(0, sourceChecked)],
            propsAction,
          )}
          {panel(
            1,
            value.filter((key) => matchesSearch(key, 1)),
            targetOptions().length,
            list,
          )}
        </div>
      );
    };
  },
);
