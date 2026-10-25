/**
 * 级联选择：一列一列往下选（省 / 市 / 区、产品大类 / 小类 / 型号、物料分类），触发框里显示整条路径“浙江 / 杭州 / 西湖区”。
 *
 *   <Cascader items={regions} getKey={(r) => r.code} getLabel={(r) => r.name} getChildren={(r) => r.children} value={_bind(path)} />
 *   <Cascader … changeOnSelect />                                      每一级都能选（选到市也行）
 *   <Cascader … hasChildren={(r) => !r.leaf} loadChildren={loadNext} />  展开时远程取下一级
 *   <Cascader … searchable />                                          按整条路径搜索（在已加载的节点里）
 *
 * - value 是从第一级到选中节点的 key 路径（同 Ant Design、Element Plus），key 只要在同级里唯一；没有选择时 null。
 * - 默认只能选到叶子：点有下一级的项只是展开；changeOnSelect 时点任何一级都选中它（并展开下一级）。
 * - 弹出层里每一级是一列 listbox，焦点在列上、高亮项经 aria-activedescendant：↑↓ 移动（有下一级的跟着显示下一列），
 *   → 进入下一级（懒加载的先取回来），← 回到上一级，Enter 选中（叶子选中后关闭），Esc 关闭并把焦点还给触发按钮。
 *   从右到左排版时左右键对调。
 * - searchable：搜索框里输入后换成一列匹配的完整路径，只列能选的（默认是叶子），↑↓、Enter 在搜索框里操作。
 * - 懒加载：hasChildren 声明有下一级，进入时 loadChildren 取回来放进数据里（数据要是响应式的），期间显示转圈；
 *   打开时沿着已选的路径逐级取回来，已选的那一列看得见。
 *
 * 部件：Root（外壳）、Trigger（button，主元素）、Value、Clear、Chevron、Popover、Search（TextField）、Column（每一列）、Option。
 */
import { Check, ChevronDown, ChevronRight, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { nextTick, useId, type VNodeChild } from 'vue';
import type { PresetIconButtonProps } from '../base/CloseButton';
import { buttonBaseStyles } from '../base/button-core';
import { Icon, type IconProps } from '../base/Icon';
import { Spinner } from '../base/Spinner';
import { useLang, useTextMatcher } from '../config/context';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';
import { isExpandable } from '../utils/data/tree';
import { inlineArrows, isRtl } from '../utils/dom/direction';
import {
  anchoredPanelSx,
  floatingStyles,
  useAnchoredPopover,
  type FloatingPlacement,
} from '../utils/dom/floating';
import { openSetter, type OpenChangeProps } from '../utils/dom/open-change';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { itemStyles } from '../utils/style/item-styles';
import { t } from '../config/theme/tokens';
import { disclosureStyles } from '../utils/style/transitions';
import {
  clickOnShell,
  controlClear,
  controlIcon,
  controlParts,
  focusOnShell,
  useControlAppearance,
  type ControlIconOptions,
  type ControlOptions,
} from './control';
import { listPopoverStyles } from './ListPopover';
import { selectStyles, type SelectManaged } from './Select';
import { TextField, type TextFieldProps } from './TextField';

/** 未声明的属性落到触发按钮（主元素）上，外壳用 propsRoot */
export interface CascaderProps<T>
  extends PartProps<'button', SelectManaged>, ControlOptions, ControlIconOptions, OpenChangeProps {
  /** 第一级的节点 */
  items?: readonly T[];
  /** 节点的 key，同级里唯一；index 是它在同级里的位置 */
  getKey: (node: T, index: number) => string;
  /** 节点的文字 */
  getLabel: (node: T) => string;
  /** 下一级；叶子或还没加载时 undefined */
  getChildren: (node: T) => readonly T[] | undefined;
  /** 有没有下一级（懒加载时还没取回来也算有）；不写时看 getChildren 是否非空 */
  hasChildren?: (node: T) => boolean;
  /** 进入一个还没有下一级的节点时取回来，放进数据里；返回 Promise 时显示加载中 */
  loadChildren?: (node: T) => Promise<unknown> | void;
  /** 不能选、不能进入的节点 */
  isDisabled?: (node: T) => boolean;
  /** 选中的路径（第一级到选中节点的 key），没有时 null：父级写 value={_bind(x)} */
  value?: readonly string[] | null;
  /** 每一级都能选；默认只能选到叶子 */
  changeOnSelect?: boolean;
  /** 触发框里显示整条路径（默认），false 时只显示最后一级 */
  showAllLevels?: boolean;
  /** 路径各级之间的分隔，默认“ / ” */
  separator?: string;
  /** 自定义触发框里的内容：参数是路径上各级的文字与节点（还没加载的节点文字是 key、节点是 undefined） */
  renderValue?: (labels: readonly string[], nodes: readonly (T | undefined)[]) => VNodeChild;
  /** 弹出层顶部带搜索框，按整条路径的文字搜索已加载的节点 */
  searchable?: boolean;
  /** 搜索时怎样算匹配：参数是路径上的节点与输入；默认路径文字包含输入（忽略大小写与重音，或用 createUi 的 textMatcher） */
  filter?: (nodes: readonly T[], query: string) => boolean;
  /** 没有选择时显示的文字，默认取语言包（请选择） */
  placeholder?: string;
  /** 是否打开：父级可以写 open={_bind(x)} */
  open?: boolean;
  /** 弹出位置，默认 bottom-start */
  placement?: FloatingPlacement;
  /** 有选择时显示清空按钮 */
  clearable?: boolean;
  /** 表单提交时的 name（用隐藏的 input，路径上每一级一个） */
  name?: string;
  /** 不可用 */
  disabled?: boolean;
  /** 只读：能聚焦、能看到已选的内容，不能打开、不能清空 */
  readonly?: boolean;
  /** 必填 */
  required?: boolean;
  /** 校验未通过 */
  invalid?: boolean;
  /** 外壳的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 已选内容那一层的部件属性 */
  propsValue?: PartProps<'span'>;
  /** 清空按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
  /** 下拉箭头的部件属性 */
  propsChevron?: Partial<IconProps>;
  /** 弹出层的部件属性 */
  propsPopover?: PartProps<'div', 'id' | 'popover'>;
  /** 搜索框的部件属性（searchable 时） */
  propsSearch?: Partial<TextFieldProps>;
  /** 每一列的部件属性 */
  propsColumn?: PartProps<'div', 'role' | 'id' | 'tabindex'>;
}

/** Cascader 的样式：columns、column、option、onPath、focused、chevron、results */
export const cascaderStyles = css.create({
  // 各列横排；列多了在弹出层里横向滚动
  columns: { display: 'flex', minHeight: 0, flexGrow: 1, overflowX: 'auto' },
  column: {
    boxSizing: 'border-box',
    flexShrink: 0,
    minWidth: '10em',
    maxWidth: '16em',
    overflowY: 'auto',
    padding: '_xs',
    outlineStyle: 'none',
    borderInlineEndWidth: { default: '_xs', ':last-child': 0 },
    borderInlineEndStyle: 'solid',
    borderInlineEndColor: '_borderMuted',
  },
  // 搜索结果是一整列，占满宽度
  results: { flexGrow: 1, maxWidth: 'none' },
  // 已展开的那一项（各列里在当前路径上的）
  onPath: { backgroundColor: '_fillHover' },
  // 列有焦点时它的高亮项画焦点环（列本身不画）
  focused: {
    outlineStyle: 'solid',
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
    outlineOffset: `calc(-1 * ${t.borderWidths.sm})`,
  },
  chevron: { flexShrink: 0, color: '_textMuted', scale: { default: null, ':dir(rtl)': '-1 1' } },
  check: { flexShrink: 0 },
  empty: { paddingBlock: '_sm', paddingInline: '_sm', color: '_textMuted' },
});

/** 搜索结果的一项：整条路径 */
interface PathHit<T> {
  readonly keys: readonly string[];
  readonly nodes: readonly T[];
  readonly label: string;
  readonly disabled: boolean;
}

/** 级联选择：触发框 + 一列一列的选项，选到叶子（或任意一级） */
export const Cascader = _component(
  <T,>({
    items = [],
    getKey,
    getLabel,
    getChildren,
    hasChildren,
    loadChildren,
    isDisabled,
    value = _bindable<readonly string[] | null>(null),
    changeOnSelect = false,
    showAllLevels = true,
    separator = ' / ',
    renderValue,
    searchable = false,
    filter,
    placeholder,
    open = _bindable(false),
    onOpenChange,
    placement = 'bottom-start',
    clearable = false,
    name,
    variant,
    size,
    radius,
    disabled,
    readonly,
    required,
    invalid,
    id,
    icon,
    propsRoot,
    propsIcon,
    propsValue,
    propsClear,
    propsChevron,
    propsPopover,
    propsSearch,
    propsColumn,
    ...rest
  }: CascaderProps<T>) => {
    const lang = useLang();
    const textMatcher = useTextMatcher();
    const baseId = useId();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    // 有没有下一级（懒加载时还没取回来也算有）；每次调用时读属性，数据换了跟着变
    const expandable = (node: T) => isExpandable(node, { getKey, getChildren, hasChildren });
    // 当前展开的路径（各列的高亮项）；有焦点的列
    let path = _state<string[]>([]);
    let focusedColumn = _state<number | null>(null);
    let search = _state('');
    let hit = _state(0);
    let loading = _state.raw<ReadonlySet<T>>(new Set());
    let shell = _state.raw<HTMLElement | null>(null);
    let trigger = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    const columnId = (level: number) => `${baseId}-column-${level}`;
    const optionId = (level: number, index: number) => `${baseId}-${level}-${index}`;
    const disabledNode = (node: T) => isDisabled?.(node) ?? false;
    const loaded = (node: T) => (getChildren(node)?.length ?? 0) > 0;

    /** 沿着 keys 找到各级的节点（找不到的地方停下：还没加载，或数据变了） */
    function nodesAlong(keys: readonly string[]): T[] {
      const found: T[] = [];
      let level = items;
      for (const key of keys) {
        const node = level.find((item, index) => getKey(item, index) === key);
        if (!node) break;
        found.push(node);
        level = getChildren(node) ?? [];
      }
      return found;
    }

    /** 要显示的各列：第一级，以及路径上每个已加载（或正在加载）下一级的节点的下一级 */
    const columns = _derived.by(() => {
      const list: { parent: T | undefined; items: readonly T[] }[] = [{ parent: undefined, items }];
      for (const node of nodesAlong(path)) {
        if (!expandable(node) || !(loaded(node) || loading.has(node))) break;
        list.push({ parent: node, items: getChildren(node) ?? [] });
      }
      return list;
    });

    /** 取回节点的下一级；有了（或取回来了）返回 true */
    async function ensureChildren(node: T): Promise<boolean> {
      if (loaded(node)) return true;
      if (!loadChildren || loading.has(node)) return false;
      const pending = loadChildren(node);
      if (!(pending instanceof Promise)) return loaded(node);
      loading = new Set([...loading, node]);
      try {
        await pending;
      } catch (error) {
        console.error('级联选择的下一级加载失败', error);
        return false;
      } finally {
        const next = new Set(loading);
        next.delete(node);
        loading = next;
      }
      return loaded(node);
    }

    function focusColumn(level: number) {
      void nextTick(() =>
        panel?.querySelector<HTMLElement>(`#${CSS.escape(columnId(level))}`)?.focus(),
      );
    }

    /** 高亮第 level 列的一项：它后面的路径换成它（有已加载的下一级时显示出来） */
    function activate(level: number, key: string) {
      path = [...path.slice(0, level), key];
    }

    /** 进入一项的下一级：先取回来，再高亮下一列的第一项并把焦点移过去 */
    async function enter(level: number, node: T, key: string) {
      activate(level, key);
      if (!expandable(node) || !(await ensureChildren(node))) return;
      // 等待期间换了高亮项：不再进入
      if (path[level] !== key) return;
      const children = getChildren(node) ?? [];
      const first = children.findIndex((child) => !disabledNode(child));
      if (first < 0) return;
      activate(level + 1, getKey(children[first]!, first));
      focusColumn(level + 1);
    }

    /** 选中一条路径；选到叶子（或从搜索结果里选）时关闭 */
    function pick(keys: readonly string[], node: T, close: boolean, event?: Event) {
      value = [...keys];
      if (close || !expandable(node)) setOpen(false, 'select', event);
    }

    /** 点一项：有下一级的展开（changeOnSelect 时同时选中），叶子选中 */
    function onOptionClick(level: number, node: T, key: string, event: MouseEvent) {
      if (disabledNode(node)) return;
      focusedColumn = level;
      if (!expandable(node)) return pick([...path.slice(0, level), key], node, true, event);
      if (changeOnSelect) pick([...path.slice(0, level), key], node, false, event);
      activate(level, key);
      void ensureChildren(node);
    }

    function onColumnKeydown(level: number, event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Tab') {
        setOpen(false, 'focus', event);
        return;
      }
      const list = columns[level]?.items ?? [];
      const current = list.findIndex((item, index) => getKey(item, index) === path[level]);
      const enabled = list.flatMap((item, index) => (disabledNode(item) ? [] : [index]));
      const go = (index: number | undefined) => {
        if (index !== undefined) activate(level, getKey(list[index]!, index));
      };
      const { forward, backward } = inlineArrows(!!panel && isRtl(panel));
      const node = current >= 0 ? list[current] : undefined;
      switch (event.key) {
        case 'ArrowDown':
          go(enabled.find((index) => index > current) ?? enabled[0]);
          break;
        case 'ArrowUp':
          go(enabled.findLast((index) => index < current) ?? enabled.at(-1));
          break;
        case 'Home':
          go(enabled[0]);
          break;
        case 'End':
          go(enabled.at(-1));
          break;
        case forward:
          if (node) void enter(level, node, path[level]!);
          break;
        case backward:
          if (level > 0) focusColumn(level - 1);
          break;
        case 'Enter':
          if (!node || disabledNode(node)) break;
          if (!expandable(node)) pick(path.slice(0, level + 1), node, true, event);
          else {
            if (changeOnSelect) pick(path.slice(0, level + 1), node, false, event);
            void enter(level, node, path[level]!);
          }
          break;
        default:
          return;
      }
      event.preventDefault();
    }

    function onColumnFocus(level: number) {
      focusedColumn = level;
      // 第一次进入这一列：高亮第一个能选的
      if (path[level] !== undefined) return;
      const list = columns[level]?.items ?? [];
      const first = list.findIndex((item) => !disabledNode(item));
      if (first >= 0) activate(level, getKey(list[first]!, first));
    }

    // 搜索：匹配的完整路径，只列能选的（默认是叶子）
    const hits = _derived.by((): PathHit<T>[] | null => {
      const text = search.trim();
      if (!searchable || !text) return null;
      const match = textMatcher();
      const found: PathHit<T>[] = [];
      const visit = (
        level: readonly T[],
        keys: readonly string[],
        nodes: readonly T[],
        off: boolean,
      ) => {
        level.forEach((node, index) => {
          const nextKeys = [...keys, getKey(node, index)];
          const nextNodes = [...nodes, node];
          const nextOff = off || disabledNode(node);
          const label = nextNodes.map(getLabel).join(separator);
          const selectable = changeOnSelect || !expandable(node);
          if (selectable && (filter ? filter(nextNodes, text) : match(label, text))) {
            found.push({ keys: nextKeys, nodes: nextNodes, label, disabled: nextOff });
          }
          visit(getChildren(node) ?? [], nextKeys, nextNodes, nextOff);
        });
      };
      visit(items, [], [], false);
      return found;
    });

    function onSearchKeydown(event: KeyboardEvent) {
      const list = hits;
      if (event.key === 'Tab') {
        setOpen(false, 'focus', event);
        return;
      }
      // 没有搜索词：↓ 进入第一列
      if (!list) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          focusColumn(Math.max(path.length - 1, 0));
        }
        return;
      }
      const enabled = list.flatMap((item, index) => (item.disabled ? [] : [index]));
      if (event.key === 'ArrowDown') hit = enabled.find((index) => index > hit) ?? enabled[0] ?? 0;
      else if (event.key === 'ArrowUp')
        hit = enabled.findLast((index) => index < hit) ?? enabled.at(-1) ?? 0;
      else if (event.key === 'Enter') {
        const chosen = list[hit];
        if (chosen && !chosen.disabled) pick(chosen.keys, chosen.nodes.at(-1)!, true, event);
      } else return;
      event.preventDefault();
    }

    async function show(event?: Event) {
      search = '';
      hit = 0;
      path = [...(value ?? [])];
      setOpen(true, 'trigger', event);
      // 沿着已选的路径逐级取回来（懒加载），已选的那一列看得见
      for (const node of nodesAlong(path).slice(0, -1)) {
        if (!(await ensureChildren(node))) break;
      }
    }

    function clear() {
      value = null;
      trigger?.focus();
    }

    const { onToggle } = useAnchoredPopover(
      () => ({
        open,
        anchor: shell,
        panel,
        floating: { placement, matchWidth: true, fitHeight: true },
        restoreFocus: false,
      }),
      { close: (reason, event) => setOpen(false, reason, event) },
    );

    // 打开后焦点进搜索框或已选的那一列；关闭时焦点还在弹层里（Esc、选中、点外面）就还给触发按钮
    function onPanelToggle(event: ToggleEvent) {
      onToggle(event);
      if (event.newState === 'open') {
        if (searchable) panel?.querySelector<HTMLElement>('input[type="search"]')?.focus();
        else focusColumn(Math.max(path.length - 1, 0));
        return;
      }
      focusedColumn = null;
      const active = document.activeElement;
      if (!active || active === document.body || panel?.contains(active)) trigger?.focus();
    }

    function onTriggerKeydown(event: KeyboardEvent) {
      const state = control();
      if (state.disabled || state.readonly) return;
      if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        void show(event);
      }
    }

    function toggle(event?: Event) {
      if (open) setOpen(false, 'trigger', event);
      else void show(event);
    }

    /** 一列选项 */
    function renderColumn(
      level: number,
      parent: T | undefined,
      list: readonly T[],
      label: () => {
        'aria-label'?: string;
        'aria-labelledby'?: string;
      },
    ) {
      const activeIndex = list.findIndex((item, index) => getKey(item, index) === path[level]);
      const focused = focusedColumn === level;
      const chosen = value ?? [];
      // 这一列在已选路径上：前面各级都与已选的一致
      const onChosenPath = path.slice(0, level).every((key, index) => chosen[index] === key);
      return (
        <div
          key={level}
          {...mergeAttrs<'div'>({ sx: cascaderStyles.column }, propsColumn, {
            id: columnId(level),
            role: 'listbox',
            tabindex: -1,
            ...label(),
            'aria-activedescendant': activeIndex >= 0 ? optionId(level, activeIndex) : undefined,
            'aria-busy': parent && loading.has(parent) ? true : undefined,
            onKeydown: (event: KeyboardEvent) => onColumnKeydown(level, event),
            onFocus: () => onColumnFocus(level),
            onBlur: () => (focusedColumn = focusedColumn === level ? null : focusedColumn),
          })}
        >
          {parent && loading.has(parent) && list.length === 0 && (
            <div {...css.attrs(cascaderStyles.empty)}>
              <Spinner label={lang.loading} />
            </div>
          )}
          {list.map((node, index) => {
            const key = getKey(node, index);
            const off = disabledNode(node);
            const branch = expandable(node);
            const active = index === activeIndex;
            const selected = onChosenPath && chosen[level] === key;
            return (
              <div
                key={key}
                id={optionId(level, index)}
                role="option"
                aria-selected={selected}
                aria-disabled={off || undefined}
                aria-haspopup={branch ? 'listbox' : undefined}
                aria-expanded={branch ? active && columns.length > level + 1 : undefined}
                {...css.attrs(
                  itemStyles.row,
                  itemStyles.hoverable,
                  active && cascaderStyles.onPath,
                  active && focused && cascaderStyles.focused,
                  selected && itemStyles.selected,
                  off && itemStyles.disabled,
                )}
                // 焦点留在列上
                onPointerdown={(event: PointerEvent) => event.preventDefault()}
                onClick={(event: MouseEvent) => {
                  panel?.querySelector<HTMLElement>(`#${CSS.escape(columnId(level))}`)?.focus();
                  onOptionClick(level, node, key, event);
                }}
                data-state={selected ? 'checked' : 'unchecked'}
                data-active={active || undefined}
                data-disabled={off || undefined}
              >
                <span {...css.attrs(itemStyles.label)}>{getLabel(node)}</span>
                {branch ? (
                  loading.has(node) ? (
                    <Spinner size="sm" />
                  ) : (
                    <Icon icon={ChevronRight} sx={cascaderStyles.chevron} />
                  )
                ) : (
                  selected && <Icon icon={Check} sx={cascaderStyles.check} />
                )}
              </div>
            );
          })}
        </div>
      );
    }

    /** 搜索结果：一列完整路径 */
    function renderHits(list: readonly PathHit<T>[]) {
      const chosen = (value ?? []).join('\u0000');
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [cascaderStyles.column, cascaderStyles.results] },
            propsColumn,
            {
              id: columnId(0),
              role: 'listbox',
              tabindex: -1,
              'aria-label': lang.selectSearch,
            },
          )}
        >
          {list.length === 0 && (
            <div {...css.attrs(cascaderStyles.empty)}>{lang.selectNoMatch}</div>
          )}
          {list.map((item, index) => {
            const selected = item.keys.join('\u0000') === chosen;
            return (
              <div
                key={item.keys.join('\u0000')}
                id={optionId(0, index)}
                role="option"
                aria-selected={selected}
                aria-disabled={item.disabled || undefined}
                {...css.attrs(
                  itemStyles.row,
                  itemStyles.hoverable,
                  index === hit && itemStyles.highlighted,
                  selected && itemStyles.selected,
                  item.disabled && itemStyles.disabled,
                )}
                onPointerdown={(event: PointerEvent) => event.preventDefault()}
                onPointermove={() => !item.disabled && (hit = index)}
                onClick={(event: MouseEvent) =>
                  !item.disabled && pick(item.keys, item.nodes.at(-1)!, true, event)
                }
              >
                <span {...css.attrs(itemStyles.label)}>{item.label}</span>
                {selected && <Icon icon={Check} sx={cascaderStyles.check} />}
              </div>
            );
          })}
        </div>
      );
    }

    return () => {
      const state = control();
      const s = controlParts(appearance(), state);
      const off = state.disabled;
      const locked = off || state.readonly;
      const keys = value ?? [];
      const nodes = nodesAlong(keys);
      // 还没加载的那几级按 key 显示
      const labels = keys.map((key, index) => (nodes[index] ? getLabel(nodes[index]) : key));
      const shown =
        keys.length === 0 ? (
          <span {...css.attrs(selectStyles.placeholder)}>
            {placeholder ?? lang.selectPlaceholder}
          </span>
        ) : (
          (renderValue?.(
            labels,
            keys.map((_, index) => nodes[index]),
          ) ?? (showAllLevels ? labels.join(separator) : labels.at(-1)))
        );
      const firstLabel = () =>
        state.labelledBy
          ? { 'aria-labelledby': state.labelledBy }
          : { 'aria-label': rest['aria-label'] };
      const list = hits;
      return (
        <>
          <div
            {...mergeAttrs<'div'>({ ...s.root, sx: [s.root.sx, selectStyles.root] }, propsRoot, {
              ref: _toRef(shell),
              onPointerdown: off ? undefined : focusOnShell(() => trigger),
              onClick: locked
                ? undefined
                : clickOnShell(
                    () => trigger,
                    (event) => toggle(event),
                  ),
            })}
            data-state={open ? 'open' : 'closed'}
            data-invalid={state.invalid || undefined}
            data-disabled={off || undefined}
          >
            {controlIcon(s, icon, propsIcon)}
            <button
              {...mergeAttrs<'button'>(
                { sx: [buttonBaseStyles.root, selectStyles.trigger] },
                rest,
                {
                  ref: _toRef(trigger),
                  id: state.id,
                  type: 'button',
                  role: 'combobox',
                  disabled: off,
                  'aria-haspopup': 'listbox',
                  'aria-expanded': open,
                  'aria-controls': columnId(0),
                  'aria-invalid': state.invalid || undefined,
                  'aria-required': state.required || undefined,
                  'aria-readonly': state.readonly || undefined,
                  'aria-describedby': state.describedBy,
                  onClick: (event: MouseEvent) => {
                    trigger?.focus();
                    if (!locked) toggle(event);
                  },
                  onKeydown: onTriggerKeydown,
                },
              )}
            >
              <span {...mergeAttrs<'span'>({ sx: selectStyles.value }, propsValue)}>{shown}</span>
            </button>
            {clearable && keys.length > 0 && !locked && controlClear(s, propsClear, clear)}
            <Icon
              {...mergePartProps<IconProps>(
                {
                  ...s.icon,
                  icon: ChevronDown,
                  sx: [s.icon.sx, disclosureStyles.icon, open && selectStyles.chevronOpen],
                },
                propsChevron,
              )}
            />
            <FormValue name={name} value={keys} disabled={state.disabled} />
          </div>
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  anchoredPanelSx(appearance().size),
                  floatingStyles.scrollPanel,
                  listPopoverStyles.panel,
                ],
              },
              propsPopover,
              { ref: _toRef(panel), popover: 'auto', onToggle: onPanelToggle },
            )}
          >
            {searchable && (
              <div {...css.attrs(listPopoverStyles.header)}>
                <TextField
                  {...mergePartProps<TextFieldProps>(
                    {
                      icon: Search,
                      variant: 'soft',
                      placeholder: lang.selectSearch,
                      'aria-label': lang.selectSearch,
                      propsRoot: { sx: selectStyles.search },
                    },
                    propsSearch,
                  )}
                  type="search"
                  value={_bind(
                    () => search,
                    (next: string) => {
                      search = next;
                      hit = 0;
                    },
                  )}
                  aria-controls={columnId(0)}
                  aria-activedescendant={list?.length ? optionId(0, hit) : undefined}
                  onKeydown={onSearchKeydown}
                />
              </div>
            )}
            {open && (
              <div {...css.attrs(cascaderStyles.columns)}>
                {list
                  ? renderHits(list)
                  : columns.map((column, level) =>
                      renderColumn(level, column.parent, column.items, () =>
                        column.parent ? { 'aria-label': getLabel(column.parent) } : firstLabel(),
                      ),
                    )}
              </div>
            )}
          </div>
        </>
      );
    };
  },
);
