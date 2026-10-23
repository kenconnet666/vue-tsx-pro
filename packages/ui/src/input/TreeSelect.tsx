/**
 * 树形下拉选择：触发框同 Select，弹出的是一棵树（组织机构、产品结构、物料分类）。单选选一个节点，多选勾选（父子联动）。
 *
 *   <TreeSelect
 *     items={orgs}
 *     getKey={(org) => org.id}
 *     getLabel={(org) => org.name}
 *     getChildren={(org) => org.children}
 *     value={_bind(orgId)}
 *     searchable
 *   />
 *   <TreeSelect … selectionMode="multiple" value={_bind(teamIds)} />   勾选：勾上父节点就是整枝
 *
 * - 单选：点节点或 Enter 选中并关闭；多选：空格或点勾选框，勾上父节点会勾上它的子孙，子节点全勾上时父节点也勾上。
 *   value 是勾上的全部节点；触发框里只显示最上层的整枝（勾上了“复合材料中心”就不再列它下面的每个组）。
 * - searchable：弹出层顶部的搜索框，按节点文字过滤，命中节点的祖先一起显示并展开；↓ 从搜索框进到树里。
 *   给 load 时由服务端搜索：打开时与输入停下 300 ms 后按搜索词请求，返回命中的节点连同祖先，结果全部展开
 *   （remote-items.ts，同 Select）；自己管请求时写 search={_bind(keyword)}、filter={false}。
 * - 打开后焦点在树上（或搜索框里），键盘同 Tree；Esc 关闭并把焦点还给触发按钮。懒加载同 Tree 的 loadChildren。
 * - 已选节点的文字从已加载的树里找，远程搜索换掉的按见过的文字显示；从没见过的（懒加载还没取回来）显示成 key。
 *
 * 部件：Root（外壳）、Trigger（button，主元素）、Value、Tag（多选时）、Clear、Chevron、Popover、Search（TextField）、Tree。
 */
import { ChevronDown, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, watch } from 'vue';
import type { PresetIconButtonProps } from '../base/CloseButton';
import { buttonBaseStyles } from '../base/button-core';
import { Icon, type IconProps } from '../base/Icon';
import { Tag, type TagProps } from '../base/Tag';
import { useLang, useTextMatcher } from '../config/context';
import { Tree, type TreeProps } from '../display/Tree';
import { useFieldControl } from '../form/Field';
import { FormValue } from '../form/FormValue';
import { selectedValues, type SelectionModes } from '../utils/data/selection';
import {
  anchoredPanelSx,
  floatingStyles,
  useAnchoredPopover,
  type FloatingPlacement,
} from '../utils/dom/floating';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { disclosureStyles } from '../utils/style/transitions';
import {
  controlClear,
  controlIcon,
  controlStyles,
  controlSx,
  clickOnShell,
  focusOnShell,
  useControlAppearance,
  type ControlIconOptions,
  type ControlOptions,
} from './control';
import { listPopoverStyles } from './ListPopover';
import { useRemoteItems, type OptionsLoader } from './remote-items';
import { selectStyles, type SelectManaged } from './Select';
import { TextField, type TextFieldProps } from './TextField';

/** 未声明的属性落到触发按钮（主元素）上，外壳用 propsRoot */
export interface TreeSelectProps<T>
  extends PartProps<'button', SelectManaged>, ControlOptions, ControlIconOptions {
  /** 顶层节点；有 load 时是第一次加载之前的树（编辑页放上已选节点的那一枝） */
  items?: readonly T[];
  /** 节点的 key，整棵树里唯一：也是选中后写回的值 */
  getKey: (node: T) => string;
  /** 节点的文字 */
  getLabel: (node: T) => string;
  /** 子节点；叶子或还没加载时 undefined */
  getChildren: (node: T) => readonly T[] | undefined;
  /** 有没有子节点（懒加载时子节点还没取回来也算有） */
  hasChildren?: (node: T) => boolean;
  /** 展开还没有子节点的节点时取回来（返回 Promise 时显示加载中） */
  loadChildren?: (node: T) => Promise<unknown> | void;
  /** 不能选的节点（只能展开，如只能选到部门、不能选公司时） */
  isDisabled?: (node: T) => boolean;
  /** 单选（默认）或多选（勾选，父子联动） */
  selectionMode?: keyof SelectionModes;
  /** 单选时是选中节点的 key（没有时 null），多选时是勾上的全部 key：父级写 value={_bind(x)} */
  value?: string | string[] | null;
  /** 没有选择时显示的文字，默认取语言包（请选择） */
  placeholder?: string;
  /** 是否打开：父级可以写 open={_bind(x)} */
  open?: boolean;
  /** 弹出位置，默认 bottom-start */
  placement?: FloatingPlacement;
  /** 有选择时显示清空按钮 */
  clearable?: boolean;
  /** 弹出层顶部带搜索框，按节点文字过滤 */
  searchable?: boolean;
  /** 搜索时怎样算命中；默认节点文字包含输入（忽略大小写与重音）。false 时不在本地过滤（服务端按 search 过滤） */
  filter?: false | ((node: T, query: string) => boolean);
  /** 搜索框里的文字：打开时清空；父级写 search={_bind(x)} 拿到它（自己发请求时） */
  search?: string;
  /** 远程搜索：打开时与搜索词停下 300 ms 后调用，返回命中的节点连同祖先（顶层节点），结果代替 items */
  load?: OptionsLoader<T>;
  /** 表单提交时的 name（用隐藏的 input） */
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
  /** 多选时每个标签的部件属性 */
  propsTag?: Partial<TagProps>;
  /** 清空按钮的部件属性 */
  propsClear?: Partial<PresetIconButtonProps>;
  /** 下拉箭头的部件属性 */
  propsChevron?: Partial<IconProps>;
  /** 弹出层的部件属性 */
  propsPopover?: PartProps<'div', 'id' | 'popover'>;
  /** 搜索框的部件属性（searchable 时） */
  propsSearch?: Partial<TextFieldProps>;
  /** 树的部件属性 */
  propsTree?: Partial<TreeProps<T>>;
}

/** TreeSelect 的样式：tree */
export const treeSelectStyles = stylex.create({
  // 树的滚动区域占满弹出层剩下的高度（最大高度由定位写在弹出层上）
  tree: { flexGrow: 1, minHeight: 0 },
  // 弹出层比触发框窄时也放得下几层缩进
  panel: { minWidth: '16em' },
});

/** 树形下拉选择：触发框 + 弹出的树，单选或勾选，可搜索 */
export const TreeSelect = _component(
  <T,>({
    items = [],
    getKey,
    getLabel,
    getChildren,
    hasChildren,
    loadChildren,
    isDisabled,
    selectionMode = 'single',
    value = _bindable<string | string[] | null>(null),
    open = _bindable(false),
    placeholder,
    placement = 'bottom-start',
    clearable = false,
    searchable = false,
    filter,
    search = _bindable(''),
    load,
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
    propsTag,
    propsClear,
    propsChevron,
    propsPopover,
    propsSearch,
    propsTree,
    ...rest
  }: TreeSelectProps<T>) => {
    const lang = useLang();
    const textMatcher = useTextMatcher();
    const treeId = useId();
    const appearance = useControlAppearance(() => ({ variant, size, radius }));
    const control = useFieldControl(() => ({ id, invalid, required, disabled, readonly }));
    const multiple = () => selectionMode === 'multiple';
    const remote = useRemoteItems({
      load: () => load,
      query: () => search,
      open: () => open,
      items: () => items,
    });
    let expanded = _state<string[]>([]);
    let shell = _state.raw<HTMLElement | null>(null);
    let trigger = _state.raw<HTMLElement | null>(null);
    let panel = _state.raw<HTMLElement | null>(null);

    // 已加载的整棵树：key → 节点与父节点，查已选的文字、搜索时找祖先都用它
    const nodes = _derived.by(() => {
      const map = new Map<string, { node: T; parent: string | undefined }>();
      const visit = (level: readonly T[], parent: string | undefined) => {
        for (const node of level) {
          const key = getKey(node);
          map.set(key, { node, parent });
          visit(getChildren(node) ?? [], key);
        }
      };
      visit(remote.items(), undefined);
      return map;
    });
    // 见过的节点文字：远程搜索换掉了已选的节点，触发框里仍显示它的文字
    const seenLabels = new Map<string, string>();
    watch(
      () => nodes,
      (map) => {
        for (const [key, { node }] of map) seenLabels.set(key, getLabel(node));
      },
      { immediate: true },
    );

    // 搜索：命中的节点与它们的祖先（为 null 时不过滤）
    const visible = _derived.by(() => {
      const text = search.trim();
      // 有 load 或 filter={false} 时结果已经是服务端筛好的
      if (!searchable || !text || load || filter === false) return null;
      const match = textMatcher();
      const hits = (node: T) => (filter ? filter(node, text) : match(getLabel(node), text));
      const keys = new Set<string>();
      for (const [key, { node }] of nodes) {
        if (!hits(node)) continue;
        for (let at: string | undefined = key; at !== undefined && !keys.has(at);) {
          keys.add(at);
          at = nodes.get(at)?.parent;
        }
      }
      return keys;
    });
    const shownItems = () => {
      const all = remote.items();
      return visible ? all.filter((node) => visible.has(getKey(node))) : all;
    };
    const shownChildren = (node: T) => {
      const children = getChildren(node);
      return visible ? children?.filter((child) => visible.has(getKey(child))) : children;
    };
    // 搜索时展开命中节点的祖先；清空搜索回到自己展开的状态
    const shownExpanded = () => {
      if (visible) return [...visible].filter((key) => nodes.has(key));
      // 服务端搜索的结果全部展开（只有命中的节点与它们的祖先）
      if (load && search.trim()) return [...nodes.keys()];
      return expanded;
    };

    const values = () => selectedValues(value);
    /** 触发框里显示的节点：多选时只列最上层的整枝（父节点也勾上了的不重复列） */
    const displayKeys = () => {
      const keys = values();
      if (!multiple()) return keys;
      const set = new Set(keys);
      return keys.filter((key) => {
        const parent = nodes.get(key)?.parent;
        return parent === undefined || !set.has(parent);
      });
    };
    const labelOf = (key: string) => {
      const found = nodes.get(key);
      return found ? getLabel(found.node) : (seenLabels.get(key) ?? key);
    };

    function show() {
      search = '';
      // 打开时展开已选节点的祖先：已选的看得见
      const ancestors = new Set(expanded);
      for (const key of values()) {
        for (let at = nodes.get(key)?.parent; at !== undefined; at = nodes.get(at)?.parent) {
          ancestors.add(at);
        }
      }
      expanded = [...ancestors];
      open = true;
    }

    function clear() {
      value = multiple() ? [] : null;
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
      { close: () => (open = false) },
    );

    // 打开后焦点进搜索框或树；关闭时焦点还在弹层里（Esc、选中、点外面）就还给触发按钮
    function onPanelToggle(event: ToggleEvent) {
      onToggle(event);
      if (event.newState === 'open') {
        const target = searchable
          ? panel?.querySelector<HTMLElement>('input[type="search"]')
          : panel?.querySelector<HTMLElement>('[role="tree"]');
        target?.focus();
        return;
      }
      const active = document.activeElement;
      if (!active || active === document.body || panel?.contains(active)) trigger?.focus();
    }

    function onTriggerKeydown(event: KeyboardEvent) {
      const state = control();
      if (state.disabled || state.readonly) return;
      if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        show();
      }
    }

    // 搜索框里 ↓ 进到树；Tab 关闭后照常移到下一个
    function onSearchKeydown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        open = false;
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        panel?.querySelector<HTMLElement>('[role="tree"]')?.focus();
      }
    }

    /** 树的属性（单选、多选共用）：搜索时换成过滤后的节点 */
    const treeProps = (labelledBy: string | undefined) =>
      mergePartProps<TreeProps<T>>(
        {
          items: shownItems(),
          getKey,
          getLabel,
          getChildren: shownChildren,
          hasChildren: visible ? undefined : hasChildren,
          loadChildren,
          loading: remote.loading(),
          empty: remote.error()
            ? lang.listLoadFailed
            : search.trim()
              ? lang.selectNoMatch
              : undefined,
          isDisabled,
          propsScrollArea: { sx: treeSelectStyles.tree },
          'aria-labelledby': labelledBy,
          'aria-label': labelledBy ? undefined : rest['aria-label'],
        },
        propsTree,
        { id: treeId },
      );

    // 单选：选中就关闭
    watch(
      () => value,
      () => {
        if (!multiple() && open) open = false;
      },
    );

    return () => {
      const state = control();
      const off = state.disabled;
      const locked = off || state.readonly;
      const shownKeys = displayKeys();
      const shown =
        shownKeys.length === 0 ? (
          <span {...stylex.attrs(selectStyles.placeholder)}>
            {placeholder ?? lang.selectPlaceholder}
          </span>
        ) : multiple() ? (
          shownKeys.map((key) => (
            <Tag key={key} {...mergePartProps<TagProps>({ size: 'sm', variant: 'soft' }, propsTag)}>
              {labelOf(key)}
            </Tag>
          ))
        ) : (
          labelOf(shownKeys[0]!)
        );
      return (
        <>
          <div
            {...mergeAttrs<'div'>(
              { sx: [controlSx(appearance(), state), selectStyles.root] },
              propsRoot,
              {
                ref: _toRef(shell),
                onPointerdown: off ? undefined : focusOnShell(() => trigger),
                onClick:
                  off || state.readonly
                    ? undefined
                    : clickOnShell(
                        () => trigger,
                        () => (open ? (open = false) : show()),
                      ),
              },
            )}
            data-state={open ? 'open' : 'closed'}
            data-invalid={state.invalid || undefined}
            data-disabled={off || undefined}
          >
            {controlIcon(icon, propsIcon)}
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
                  'aria-haspopup': 'tree',
                  'aria-expanded': open,
                  'aria-controls': treeId,
                  'aria-invalid': state.invalid || undefined,
                  'aria-required': state.required || undefined,
                  'aria-readonly': state.readonly || undefined,
                  'aria-describedby': state.describedBy,
                  onClick: () => {
                    trigger?.focus();
                    if (locked) return;
                    if (open) open = false;
                    else show();
                  },
                  onKeydown: onTriggerKeydown,
                },
              )}
            >
              <span {...mergeAttrs<'span'>({ sx: selectStyles.value }, propsValue)}>{shown}</span>
            </button>
            {clearable && shownKeys.length > 0 && !locked && controlClear(propsClear, clear)}
            <Icon
              {...mergePartProps<IconProps>(
                {
                  icon: ChevronDown,
                  sx: [controlStyles.icon, disclosureStyles.icon, open && selectStyles.chevronOpen],
                },
                propsChevron,
              )}
            />
            <FormValue name={name} value={values()} disabled={state.disabled} />
          </div>
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  anchoredPanelSx(appearance().size),
                  floatingStyles.scrollPanel,
                  listPopoverStyles.panel,
                  treeSelectStyles.panel,
                ],
              },
              propsPopover,
              { ref: _toRef(panel), popover: 'auto', onToggle: onPanelToggle },
            )}
          >
            {searchable && (
              <div {...stylex.attrs(listPopoverStyles.header)}>
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
                  value={_bind(search)}
                  aria-controls={treeId}
                  onKeydown={onSearchKeydown}
                />
              </div>
            )}
            {open &&
              (multiple() ? (
                <Tree
                  {...treeProps(state.labelledBy)}
                  checkable
                  checked={_bind(
                    () => [...values()],
                    (next: string[]) => (value = next),
                  )}
                  expanded={_bind(
                    () => shownExpanded(),
                    (next: string[]) => (expanded = visible ? expanded : next),
                  )}
                />
              ) : (
                <Tree
                  {...treeProps(state.labelledBy)}
                  selectionMode="single"
                  selected={_bind(
                    () => [...values()],
                    // 再点已选的一项：不取消（同 Select 的单选），只是收起；要清空用清除按钮
                    (next: string[]) => (next.length ? (value = next[0]) : (open = false)),
                  )}
                  expanded={_bind(
                    () => shownExpanded(),
                    (next: string[]) => (expanded = visible ? expanded : next),
                  )}
                />
              ))}
          </div>
        </>
      );
    };
  },
);
