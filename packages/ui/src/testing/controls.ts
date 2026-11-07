/**
 * 组件的 harness：在测试里按用户的操作驱动复合控件，不用知道内部结构（同 Angular CDK 的 component harness）。
 * 每个 harness 接收控件的元素（getControl(root, '城市') 找到的，或自己 querySelector 的），方法都等渲染完才返回。
 *
 *   const city = selectHarness(getControl(root, '城市'));
 *   await city.choose('上海');
 *   expect(city.text()).toBe('上海');
 *   await datePickerHarness(getControl(root, '交货日期')).pick('2026-11-07');
 *   await cascaderHarness(getControl(root, '地区')).choose('浙江', '杭州', '西湖区');
 *   expect(dataTableHarness(getControl(root, '采购单')).rows()).toEqual([['PO-1031', '华东钢铁'], …]);
 *
 * 只依赖读屏用的语义（role、aria-*）与部件标记（data-part），组件的样式、结构改了也不用改测试。
 * 挂载后先 await settle()：虚拟滚动的树、表格在第一次测量后才有行。
 */
import { click, itemText, press, settle, typeText } from './dom';

/** 元素本身或它里面第一个符合的元素 */
function within<T extends HTMLElement>(element: HTMLElement, selector: string, what: string): T {
  const found = element.matches(selector) ? element : element.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`${what}：在给的元素里找不到 ${selector}`);
  return found as T;
}

/** 弹出的列表：触发框的 aria-controls 指向它 */
function controlled(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute('aria-controls');
  return id ? trigger.ownerDocument.getElementById(id) : null;
}

/** 在一组元素里按文字找一个；找不到时列出有的 */
function byText(items: readonly HTMLElement[], text: string, what: string): HTMLElement {
  const found = items.find((item) => itemText(item) === text);
  if (found) return found;
  throw new Error(`${what}里没有“${text}”；有：${items.map(itemText).join('、') || '（空）'}`);
}

/** 下拉选择（Select；多选时 choose 可以给几项） */
export function selectHarness(element: HTMLElement) {
  const trigger = within(element, '[role="combobox"]', 'selectHarness');
  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';
  const listbox = () => controlled(trigger);
  const options = () => [...(listbox()?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
  return {
    /** 触发框里显示的文字（已选的项或占位文字） */
    text: () => (trigger.textContent ?? '').trim(),
    /** 弹出层开着 */
    isOpen,
    /** 打开 */
    async open() {
      if (!isOpen()) await click(trigger);
    },
    /** 关上（Esc） */
    async close() {
      if (isOpen()) await press('Escape', trigger);
    },
    /** 选项的文字（会先打开） */
    async options() {
      await this.open();
      return options().map(itemText);
    },
    /** 选中这几项（单选时选最后一项）：按文字找 */
    async choose(...labels: string[]) {
      await this.open();
      for (const label of labels) await click(byText(options(), label, '选项'));
    },
    /** 在弹出层的搜索框里输入（searchable） */
    async search(text: string) {
      await this.open();
      const panel = listbox()?.closest('[popover]') ?? listbox()?.parentElement;
      const input = panel?.querySelector<HTMLInputElement>('input');
      if (!input) throw new Error('selectHarness.search：弹出层里没有搜索框（searchable 才有）');
      await typeText(input, text);
    },
  };
}

/** 级联选择（Cascader）：一级一级点下去 */
export function cascaderHarness(element: HTMLElement) {
  const trigger = within(element, '[role="combobox"]', 'cascaderHarness');
  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';
  const columns = () => {
    const first = controlled(trigger);
    const panel = first?.closest('[popover]') ?? trigger.ownerDocument;
    return [...panel.querySelectorAll<HTMLElement>('[role="listbox"]')];
  };
  return {
    text: () => (trigger.textContent ?? '').trim(),
    isOpen,
    async open() {
      if (!isOpen()) await click(trigger);
    },
    /** 每一列选项的文字 */
    async columns() {
      await this.open();
      return columns().map((column) =>
        [...column.querySelectorAll<HTMLElement>('[role="option"]')].map(itemText),
      );
    },
    /** 按路径选：每一级按文字点下去（最后一级是叶子时选中并关上） */
    async choose(...path: string[]) {
      await this.open();
      for (const [level, label] of path.entries()) {
        const column = columns()[level];
        if (!column)
          throw new Error(`第 ${level + 1} 列还没出来（上一级“${path[level - 1]}”没有下一级？）`);
        await click(
          byText(
            [...column.querySelectorAll<HTMLElement>('[role="option"]')],
            label,
            `第 ${level + 1} 列`,
          ),
        );
      }
    },
  };
}

/** 树（Tree），也用在 TreeSelect 的弹出层里 */
export function treeHarness(element: HTMLElement) {
  const tree = within(element, '[role="tree"]', 'treeHarness');
  const items = () => [...tree.querySelectorAll<HTMLElement>('[role="treeitem"]')];
  const item = (label: string) => byText(items(), label, '树');
  return {
    /** 看得见的节点（展开了的）的文字，按显示的顺序 */
    labels: () => items().map(itemText),
    /** 展开（已经展开时不动） */
    async expand(label: string) {
      const node = item(label);
      if (node.getAttribute('aria-expanded') === 'false')
        await click(node.querySelector('[data-part="toggle"]') ?? node);
    },
    /** 收起 */
    async collapse(label: string) {
      const node = item(label);
      if (node.getAttribute('aria-expanded') === 'true')
        await click(node.querySelector('[data-part="toggle"]') ?? node);
    },
    /** 点这个节点（可选择时选中，可勾选时勾上或取消，否则展开收起） */
    async click(label: string) {
      await click(item(label));
    },
    /** 勾上或取消（checkable） */
    async check(label: string) {
      const node = item(label);
      await click(node.querySelector('[data-part="checkbox"]') ?? node);
    },
    /** 选中的节点 */
    selected: () =>
      items()
        .filter((node) => node.getAttribute('aria-selected') === 'true')
        .map(itemText),
    /** 勾上的节点（半选的不算） */
    checked: () =>
      items()
        .filter((node) => node.getAttribute('aria-checked') === 'true')
        .map(itemText),
  };
}

/** 树形选择（TreeSelect）：打开后在树里选 */
export function treeSelectHarness(element: HTMLElement) {
  const trigger = within(element, '[role="combobox"]', 'treeSelectHarness');
  const isOpen = () => trigger.getAttribute('aria-expanded') === 'true';
  const tree = () => {
    const found = controlled(trigger);
    if (!found) throw new Error('treeSelectHarness：弹出层还没打开');
    return treeHarness(found);
  };
  return {
    text: () => (trigger.textContent ?? '').trim(),
    isOpen,
    async open() {
      if (!isOpen()) await click(trigger);
    },
    /** 打开后的树（展开、看节点） */
    async tree() {
      await this.open();
      return tree();
    },
    /** 按路径展开到最后一个并点它（选中或勾上） */
    async choose(...path: string[]) {
      await this.open();
      for (const label of path.slice(0, -1)) await tree().expand(label);
      await tree().click(path.at(-1)!);
    },
  };
}

/** 日期的分段输入：DateField、TimeField、DatePicker 的输入部分（按段依次键入） */
export function dateFieldHarness(element: HTMLElement) {
  // 分段所在的那一组（DatePicker 的外壳里还有别的元素）
  const group =
    [element, ...element.querySelectorAll<HTMLElement>('[role="group"]')].find(
      (candidate) =>
        candidate.getAttribute('role') === 'group' &&
        candidate.querySelector('[role="spinbutton"]'),
    ) ?? within(element, '[role="spinbutton"]', 'dateFieldHarness').parentElement!;
  const segments = () => [...group.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
  return {
    /** 显示的文字（年/月/日 或 2026/11/07） */
    text: () => (group.textContent ?? '').trim(),
    /**
     * 按 ISO 写法填：'2026-11-07'、'2026-11-07T14:30'、'14:30'；按段的类型取对应的数字，逐段键入
     */
    async fill(value: string) {
      const match = /^(?:(\d{4})-(\d{2})(?:-(\d{2}))?)?(?:T?(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
        value,
      );
      if (!match)
        throw new Error(
          `dateFieldHarness.fill：认不出“${value}”（写成 2026-11-07、2026-11-07T14:30 或 14:30）`,
        );
      const parts: Record<string, string | undefined> = {
        year: match[1],
        month: match[2],
        day: match[3],
        hour: match[4],
        minute: match[5],
        second: match[6],
      };
      for (const segment of segments()) {
        const digits = parts[segment.dataset.type ?? ''];
        if (digits) await typeText(segment, digits);
      }
      await settle();
    },
    /** 清空：每段按两次 Backspace */
    async clear() {
      for (const segment of segments()) {
        segment.focus();
        await press('Backspace', segment);
        await press('Backspace', segment);
      }
    },
  };
}

/** 日期选择（DatePicker）：输入部分按段键入，也能打开日历 */
export function datePickerHarness(element: HTMLElement) {
  const field = dateFieldHarness(element);
  return {
    ...field,
    /** 选一天（逐段键入，同 fill） */
    pick: (value: string) => field.fill(value),
    /** 点日历按钮打开弹出层 */
    async open() {
      const button = element.querySelector<HTMLElement>('button[aria-haspopup]');
      if (!button) throw new Error('datePickerHarness.open：找不到打开日历的按钮');
      if (button.getAttribute('aria-expanded') !== 'true') await click(button);
    },
  };
}

/** 数据表格（DataTable、TreeDataTable、ColumnTable） */
export function dataTableHarness(element: HTMLElement) {
  const table = within(element, 'table', 'dataTableHarness');
  const headerCells = () => [...table.querySelectorAll<HTMLElement>('thead th')];
  const bodyRows = () =>
    [...table.querySelectorAll<HTMLElement>('tbody tr')].filter(
      (row) => !row.hasAttribute('aria-hidden') && row.querySelector('td'),
    );
  const cells = (row: HTMLElement) =>
    [...row.querySelectorAll<HTMLElement>('td, th')].filter(
      (cell) => !cell.hasAttribute('aria-hidden'),
    );
  return {
    /** 表头的文字（多级表头按出现的先后） */
    headers: () => headerCells().map((cell) => (cell.textContent ?? '').trim()),
    /** 每一行各格的文字 */
    rows: () => bodyRows().map((row) => cells(row).map((cell) => (cell.textContent ?? '').trim())),
    /** 某一格的文字（行、列从 0 起） */
    cell: (row: number, column: number) =>
      (cells(bodyRows()[row]!)[column]?.textContent ?? '').trim(),
    /** 点列标题排序（再点一次换方向） */
    async sort(header: string) {
      const th = byText(headerCells(), header, '表头');
      await click(th.querySelector('button') ?? th);
    },
    /** 列的排序方向（th 的 aria-sort） */
    sortOf: (header: string) => byText(headerCells(), header, '表头').getAttribute('aria-sort'),
    /** 勾选第几行（多选时的复选框，单选时的单选按钮） */
    async selectRow(index: number) {
      const row = bodyRows()[index];
      if (!row) throw new Error(`没有第 ${index} 行（共 ${bodyRows().length} 行）`);
      const box = row.querySelector<HTMLElement>('input[type="checkbox"], input[type="radio"]');
      await click(box ?? row);
    },
  };
}
