/**
 * 选项列表的状态（WAI-ARIA Listbox 的数据层）：选项、高亮项、已选项、键盘移动、类型搜索。
 * 不碰 DOM：Listbox、Select、Combobox 各自决定焦点在哪（列表自己、触发按钮、输入框），
 * 高亮项用 aria-activedescendant 告诉读屏（焦点不动，Combobox 才能边输入边选）。参考 React Aria 的 useListState。
 *
 *   const list = useListState({ items: () => users, toOption: (user) => ({ value: user.id, label: user.name }),
 *     selected: () => [value], mode: () => 'single', onChange });
 *   if (handleListKeydown(list, event, { space: true, typeahead: true })) event.preventDefault();
 */
import { computed, ref } from 'vue';
import type { IconData } from '../base/Icon';
import { toggleSelection, type SelectionModes } from '../utils/data/selection';
import { createTypeahead } from '../utils/dom/typeahead';

/** 一个选项 */
export interface ListboxOption {
  /** 值：选中后写回的就是它，同一列表里不能重复 */
  value: string;
  /** 显示的文字；类型搜索、Combobox 过滤、Select 触发框里显示的都是它 */
  label: string;
  /** 不可用：可以被方向键经过（读屏能听到），不能选中 */
  disabled?: boolean;
  /** 文字下方的说明 */
  description?: string;
  /** 文字前的图标 */
  icon?: IconData;
  /** 分组名：同名的选项排在一组，组名显示在组的第一行 */
  group?: string;
}

/** 列表里的一项：选项的显示信息，加上它来自的原始数据 */
export interface ListItem<T> extends ListboxOption {
  /** items 里对应的那一项：自定义渲染、renderValue 拿到的就是它 */
  readonly item: T;
}

/**
 * 数据 → 选项的显示信息：items 已经是 ListboxOption 时可以不写，否则必填。
 * 后端数据直接传给 items，不用先 map 成 { value, label }：
 *   <Select items={users} toOption={(user) => ({ value: user.id, label: user.name })} />
 */
export type OptionMapping<T> = [T] extends [ListboxOption]
  ? {
      /** 数据 → 选项（值、文字、不可用、分组…）；items 已经是 ListboxOption，可以不写 */
      toOption?: (item: T) => ListboxOption;
    }
  : {
      /** 数据 → 选项（值、文字、不可用、分组…） */
      toOption: (item: T) => ListboxOption;
    };

/**
 * useListState 的选项。按字段给读取函数（不是一个返回整个对象的 read）：
 * 选项上万时，选择变了不该重新整理选项，各字段要分开追踪依赖
 */
export interface ListStateOptions<T> {
  /** 数据 */
  items: () => readonly T[];
  /** 数据 → 选项；不写时 items 本身就是 ListboxOption。在 computed 里调用，读到的 props 会被追踪 */
  toOption?: (item: T) => ListboxOption;
  /** 已选的值 */
  selected: () => readonly string[];
  /** 单选或多选 */
  mode: () => keyof SelectionModes;
  /** 至少保留一项（单选时再点已选项不取消） */
  required?: () => boolean;
  /** 选择变化 */
  onChange: (values: readonly string[]) => void;
}

/** 列表的状态与操作 */
export interface ListState<T> {
  /** 按分组排好的选项：渲染与键盘移动都按这个顺序 */
  readonly options: readonly ListItem<T>[];
  /** 高亮（键盘或指针所在）的选项的值 */
  readonly active: string | undefined;
  /** 值在 options 里的位置；不在时 -1 */
  indexOf(value: string): number;
  /** 是否已选 */
  isSelected(value: string): boolean;
  /** 设置高亮项；undefined 取消高亮 */
  setActive(value: string | undefined): void;
  /** 高亮已选的第一项，没有已选时高亮第一个可用项（打开下拉、列表获得焦点时） */
  activateDefault(): void;
  /** 移动高亮：±n 项（到头时停住），或到第一项 / 最后一项；跳过不可用的项 */
  move(step: number | 'first' | 'last'): void;
  /** 切换一项的选中（不可用的项忽略）；返回是否发生了变化 */
  select(value: string): boolean;
  /** 类型搜索：按下一个字符，高亮以它开头的项；返回是否命中 */
  typeahead(key: string): boolean;
}

/** 按分组排序：没有分组的在前，各组按第一次出现的顺序，组内保持原顺序 */
function grouped<O extends ListboxOption>(options: readonly O[]): readonly O[] {
  if (!options.some((option) => option.group != null)) return options;
  const order = new Map<string | undefined, O[]>([[undefined, []]]);
  for (const option of options) {
    const list = order.get(option.group) ?? [];
    if (!order.has(option.group)) order.set(option.group, list);
    list.push(option);
  }
  return [...order.values()].flat();
}

/** 列表状态（组件 setup 里调用） */
export function useListState<T>(config: ListStateOptions<T>): ListState<T> {
  const active = ref<string | undefined>();
  const search = createTypeahead();
  // 选项多（上万）时这些每次渲染要读很多遍：缓存起来，数据或选择变了才重算
  const options = computed(() =>
    grouped(
      config.items().map((item): ListItem<T> => {
        const option = config.toOption ? config.toOption(item) : (item as ListboxOption);
        return { ...option, item };
      }),
    ),
  );
  const indices = computed(
    () => new Map(options.value.map((option, index) => [option.value, index])),
  );
  const selected = computed(() => new Set(config.selected()));

  const enabled = (options: readonly ListItem<T>[]) => options.filter((option) => !option.disabled);

  const state: ListState<T> = {
    get options() {
      return options.value;
    },
    get active() {
      // 选项变了（过滤、异步加载）后高亮项可能已经不在了
      return active.value !== undefined && indices.value.has(active.value)
        ? active.value
        : undefined;
    },
    indexOf: (value) => indices.value.get(value) ?? -1,
    isSelected: (value) => selected.value.has(value),
    setActive(value) {
      active.value = value;
    },
    activateDefault() {
      const usable = enabled(state.options);
      active.value = (usable.find((option) => state.isSelected(option.value)) ?? usable[0])?.value;
    },
    move(step) {
      const usable = enabled(state.options);
      if (!usable.length) return;
      const index = usable.findIndex((option) => option.value === state.active);
      let next: number;
      if (step === 'first') next = 0;
      else if (step === 'last') next = usable.length - 1;
      else if (index < 0) next = step > 0 ? 0 : usable.length - 1;
      else next = Math.min(usable.length - 1, Math.max(0, index + step));
      active.value = usable[next]!.value;
    },
    select(value) {
      const option = state.options[state.indexOf(value)];
      if (!option || option.disabled) return false;
      const current = config.selected();
      const next = toggleSelection(current, value, {
        mode: config.mode(),
        required: config.required?.() ?? false,
      });
      if (next === current) return false;
      config.onChange(next);
      return true;
    },
    typeahead(key) {
      const usable = enabled(state.options);
      const index = usable.findIndex((option) => option.value === state.active);
      const match = search.next(
        key,
        usable.map((option) => option.label),
        index,
      );
      if (match < 0) return false;
      active.value = usable[match]!.value;
      return true;
    },
  };
  return state;
}

/** handleListKeydown 的选项：不同的宿主（列表、触发按钮、输入框）对空格与字母的处理不同 */
export interface ListKeydownOptions {
  /** 空格选中高亮项（列表、Select）；输入框里空格是文字，不选 */
  space?: boolean;
  /** 字母做类型搜索（列表、Select）；输入框里字母是文字 */
  typeahead?: boolean;
  /** Home / End 到第一项 / 最后一项，默认 true；输入框里它们移动光标 */
  homeEnd?: boolean;
}

/** 一页移动几项（Page Up / Page Down） */
const PAGE = 10;

/**
 * 列表的键盘操作：↑↓ 移动、Home / End、Page Up / Page Down、Enter（与可选的空格）选中、类型搜索。
 * 返回是否处理了这个按键（处理了就该 preventDefault）；Enter / 空格选中时 onSelect 收到被选的值
 */
export function handleListKeydown<T>(
  list: ListState<T>,
  event: KeyboardEvent,
  { space = false, typeahead = false, homeEnd = true }: ListKeydownOptions = {},
  onSelect?: (value: string) => void,
): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey) return false;
  const moves: Record<string, number | 'first' | 'last'> = {
    ArrowDown: 1,
    ArrowUp: -1,
    Home: 'first',
    End: 'last',
    PageDown: PAGE,
    PageUp: -PAGE,
  };
  const move =
    homeEnd || (event.key !== 'Home' && event.key !== 'End') ? moves[event.key] : undefined;
  if (move !== undefined) {
    list.move(move);
    return true;
  }
  if (event.key === 'Enter' || (space && event.key === ' ')) {
    const value = list.active;
    if (value === undefined) return event.key === ' ';
    list.select(value);
    onSelect?.(value);
    return true;
  }
  return typeahead ? list.typeahead(event.key) : false;
}
