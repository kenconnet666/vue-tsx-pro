// 键盘：真实浏览器里按键操作有自己键盘逻辑的组件（达标矩阵的浏览器测试一项）。
// Accordion 的方向键与 Home / End，NumberField 的 ↑ / ↓ / PageUp，Mentions 的 @ 与 ↓ Enter，FloatButtonGroup 速拨的 Esc，
// Menu 里 MenuSub 的 → 与 ←，ResizeHandle 与 Splitter 的方向键，DateField 的分段（DateSegmentGroup）↑ 与 →，
// CommentComposer 的 Ctrl+Enter 与 Esc，ToggleGroup 的漫游焦点，TreeSelect、Cascader 打开后在树、列里走，
// KanbanBoard 的拿起与换列，Drawer 的 Esc（经过 beforeClose）与拖宽手柄，ColorField 的 Enter，Checkbox、Switch 的空格
import { Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Accordion,
  AccordionItem,
  Button,
  Cascader,
  Checkbox,
  ColorField,
  DateField,
  Drawer,
  Field,
  Menu,
  MenuItem,
  MenuSub,
  Mentions,
  NumberField,
  ResizeHandle,
  Splitter,
  Switch,
  ToggleGroup,
  ToggleItem,
  TreeSelect,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { FloatButton, FloatButtonGroup } from '@zerodep-dev/vue-tsx-pro-ui';
import { CommentComposer, KanbanBoard } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from './mount';

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));
const focused = () => document.activeElement as HTMLElement | null;
// 焦点留在容器上、当前项经 aria-activedescendant 指出的（Tree、Cascader 的列）：当前项的文字
const active = () => {
  const id = focused()?.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id)?.textContent : undefined;
};

describe('键盘', () => {
  it('Accordion：↓ / ↑ 在标题之间移动、到头循环，Home / End 到两端，Enter 展开', async () => {
    const root = mount(
      _component(() => {
        let open = _state<string | null>(null);
        return () => (
          <Accordion _value={open} aria-label="常见问题">
            <AccordionItem value="a" title="多久发货？">
              48 小时内
            </AccordionItem>
            <AccordionItem value="b" title="怎么退款？">
              七天内
            </AccordionItem>
            <AccordionItem value="c" title="开发票吗？">
              开
            </AccordionItem>
          </Accordion>
        );
      }),
    );
    const triggers = [...root.querySelectorAll<HTMLButtonElement>('button[aria-expanded]')];
    triggers[0]!.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()).toBe(triggers[1]);
    await userEvent.keyboard('{End}');
    expect(focused()).toBe(triggers[2]);
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()).toBe(triggers[0]);
    await userEvent.keyboard('{Home}{Enter}');
    await tick();
    expect(triggers[0]!.getAttribute('aria-expanded')).toBe('true');
  });

  it('NumberField：↑ / ↓ 加减一个 step，PageUp 加一个 bigStep', async () => {
    let count = 0;
    const root = mount(
      _component(() => {
        let value = _state<number | null>(10);
        return () => (
          <NumberField
            _value={value}
            onUpdate:_value={(next: number | null) => {
              value = next;
              count = next ?? 0;
            }}
            step={2}
            bigStep={10}
            aria-label="数量"
          />
        );
      }),
    );
    root.querySelector('input')!.focus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(count).toBe(14);
    await userEvent.keyboard('{ArrowDown}');
    expect(count).toBe(12);
    await userEvent.keyboard('{PageUp}');
    expect(count).toBe(22);
  });

  it('Mentions：输入 @ 弹出列表，↓ 移动高亮，Enter 写成“@名字 ”', async () => {
    let text = '';
    const root = mount(
      _component(() => {
        let value = _state('');
        return () => (
          <Mentions
            _value={value}
            onUpdate:_value={(next: string) => {
              value = next;
              text = next;
            }}
            items={[
              { value: 'U1', label: '周宁' },
              { value: 'U2', label: '陆川' },
            ]}
            aria-label="留言"
          />
        );
      }),
    );
    await userEvent.click(root.querySelector('textarea')!);
    await userEvent.keyboard('@');
    await expect.poll(() => document.querySelectorAll('[role="option"]').length).toBe(2);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect.poll(() => text).toBe('@陆川 ');
  });

  it('FloatButtonGroup 速拨：Enter 展开，Esc 收起并回到主按钮', async () => {
    const root = mount(() => (
      <FloatButtonGroup icon={Plus} aria-label="快捷操作">
        <FloatButton icon={Plus} aria-label="新建" />
        <FloatButton icon={Plus} aria-label="导入" />
      </FloatButtonGroup>
    ));
    const main = root.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    main.focus();
    await userEvent.keyboard('{Enter}');
    await tick();
    expect(main.getAttribute('aria-expanded')).toBe('true');
    // 焦点还在主按钮上（展开的按钮上的提示框会先吃掉一次 Esc）
    await userEvent.keyboard('{Escape}');
    await tick();
    expect(main.getAttribute('aria-expanded')).toBe('false');
    expect(focused()).toBe(main);
  });

  it('Menu 的 MenuSub：→ 打开子菜单并聚焦第一项，← 关上回到这一项', async () => {
    const root = mount(() => (
      <Menu trigger={(props) => <Button {...props}>操作</Button>}>
        <MenuItem>编辑</MenuItem>
        <MenuSub label="分享">
          <MenuItem>复制链接</MenuItem>
          <MenuItem>发邮件</MenuItem>
        </MenuSub>
      </Menu>
    ));
    root.querySelector<HTMLButtonElement>('button')!.focus();
    await userEvent.keyboard('{ArrowDown}');
    await tick();
    await userEvent.keyboard('{ArrowDown}');
    expect(focused()?.textContent).toContain('分享');
    await userEvent.keyboard('{ArrowRight}');
    await tick();
    expect(focused()?.textContent).toBe('复制链接');
    await userEvent.keyboard('{ArrowLeft}');
    await tick();
    expect(focused()?.textContent).toContain('分享');
  });

  it('ResizeHandle：→ / ← 一次一个 step', async () => {
    let width = 240;
    const root = mount(() => (
      <aside style="position: relative; width: 240px; height: 100px">
        <ResizeHandle
          aria-label="调整侧栏宽度"
          width={width}
          step={20}
          onWidthChange={(px: number) => (width = px)}
        />
      </aside>
    ));
    root.querySelector<HTMLElement>('[aria-label="调整侧栏宽度"]')!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(width).toBe(260);
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(width).toBe(220);
  });

  it('DateField 的分段（DateSegmentGroup）：↑ 改这一段，→ 到下一段', async () => {
    const root = mount(() => (
      <Field label="交货日期">
        <DateField _value="2026-11-07" />
      </Field>
    ));
    const [year, month] = [...root.querySelectorAll<HTMLElement>('[role="spinbutton"]')];
    year!.focus();
    await userEvent.keyboard('{ArrowUp}');
    await tick();
    expect(year!.textContent).toBe('2027');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe(month);
  });

  it('CommentComposer：Ctrl + Enter 发送', async () => {
    const sent: string[] = [];
    const root = mount(() => <CommentComposer onSend={(draft) => void sent.push(draft.content)} />);
    await userEvent.click(root.querySelector('textarea')!);
    await userEvent.keyboard('收到，下午确认');
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    await expect.poll(() => sent).toEqual(['收到，下午确认']);
  });

  it('CommentComposer：Esc 取消（给了 onCancel 时）', async () => {
    let cancelled = 0;
    const root = mount(() => <CommentComposer onSend={() => {}} onCancel={() => cancelled++} />);
    await userEvent.click(root.querySelector('textarea')!);
    await userEvent.keyboard('{Escape}');
    expect(cancelled).toBe(1);
  });

  it('Splitter：← / → 每次 5%，Home / End 到最小、最大，Enter 收起可收起的一侧', async () => {
    const root = mount(() => (
      <Splitter collapsible="end" start="列表" end="预览" style="height: 120px" />
    ));
    const handle = root.querySelector<HTMLElement>('[role="separator"]')!;
    const now = () => handle.getAttribute('aria-valuenow');
    handle.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(now()).toBe('55');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(now()).toBe('45');
    await userEvent.keyboard('{Home}');
    expect(now()).toBe('20');
    await userEvent.keyboard('{End}');
    expect(now()).toBe('80');
    const end = handle.parentElement!.nextElementSibling as HTMLElement;
    await userEvent.keyboard('{Enter}');
    await tick();
    expect(end.hidden).toBe(true);
    await userEvent.keyboard('{Enter}');
    await tick();
    expect(end.hidden).toBe(false);
  });

  it('ToggleGroup：整组一个 Tab 位置，方向键移动焦点不改选择、到头循环，空格按下', async () => {
    let view: string | null = 'grid';
    const root = mount(
      _component(() => {
        let value = _state<string | null>('grid');
        return () => (
          <div>
            <button>前面</button>
            <ToggleGroup
              _value={value}
              onUpdate:_value={(next: string | null) => {
                value = next;
                view = next;
              }}
              aria-label="视图"
            >
              <ToggleItem value="list">列表</ToggleItem>
              <ToggleItem value="grid">网格</ToggleItem>
              <ToggleItem value="board">看板</ToggleItem>
            </ToggleGroup>
            <button>后面</button>
          </div>
        );
      }),
    );
    const [, list, grid, board, after] = [...root.querySelectorAll<HTMLButtonElement>('button')];
    root.querySelector('button')!.focus();
    await userEvent.tab();
    expect(focused()).toBe(grid);
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe(board);
    expect(view).toBe('grid');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe(list);
    await userEvent.keyboard('{End}');
    expect(focused()).toBe(board);
    await userEvent.keyboard(' ');
    expect(view).toBe('board');
    // 整组只占一个 Tab 位置：再按 Tab 就到了组后面的按钮
    await userEvent.tab();
    expect(focused()).toBe(after);
  });

  const orgs = [
    {
      id: 'assembly',
      name: '生产制造中心',
      children: [
        { id: 'system', name: '技术集成团队' },
        { id: 'testing', name: '测试团队' },
      ],
    },
    { id: 'purchase', name: '采购部' },
  ];

  it('TreeSelect：↓ 打开并进到树里，→ 展开、↓ 移动，Enter 选中、关闭并回到触发按钮', async () => {
    let picked: string | null = null;
    const root = mount(
      _component(() => {
        let value = _state<string | null>(null);
        return () => (
          <TreeSelect
            items={orgs}
            getKey={(org) => org.id}
            getLabel={(org) => org.name}
            getChildren={(org) => org.children}
            _value={value}
            onUpdate:_value={(next: string | null) => {
              value = next;
              picked = next;
            }}
            aria-label="单位"
          />
        );
      }),
    );
    const trigger = root.querySelector<HTMLButtonElement>('button[role="combobox"]')!;
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(() => focused()?.getAttribute('role')).toBe('tree');
    expect(active()).toContain('生产制造中心');
    await userEvent.keyboard('{ArrowRight}');
    await tick();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await expect.poll(active).toContain('测试团队');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => picked).toBe('testing');
    await expect.poll(() => focused()).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('Cascader：↓ 打开进到第一列（高亮项的下一级跟着显示），→ 进到下一列，Enter 选中叶子并关闭', async () => {
    let picked: readonly string[] | null = null;
    const root = mount(
      _component(() => {
        let value = _state<readonly string[] | null>(null);
        return () => (
          <Cascader
            items={orgs}
            getKey={(org) => org.id}
            getLabel={(org) => org.name}
            getChildren={(org) => org.children}
            _value={value}
            onUpdate:_value={(next: readonly string[] | null) => {
              value = next;
              picked = next;
            }}
            aria-label="单位"
          />
        );
      }),
    );
    const trigger = root.querySelector<HTMLButtonElement>('button[role="combobox"]')!;
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect.poll(active).toBe('生产制造中心');
    expect(document.querySelectorAll('[role="listbox"]')).toHaveLength(2);
    await userEvent.keyboard('{ArrowRight}');
    await expect.poll(active).toBe('技术集成团队');
    await userEvent.keyboard('{ArrowDown}');
    expect(active()).toBe('测试团队');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => picked).toEqual(['assembly', 'testing']);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('KanbanBoard：空格拿起，→ 换到下一列，Enter 放下；Esc 取消', async () => {
    const moves: string[] = [];
    const cards = [
      { id: 'a', title: '写文档', stage: 'todo' },
      { id: 'b', title: '修 bug', stage: 'doing' },
    ];
    const root = mount(() => (
      <KanbanBoard
        aria-label="看板"
        columns={[
          { key: 'todo', label: '待处理' },
          { key: 'doing', label: '处理中' },
        ]}
        items={cards}
        getKey={(card) => card.id}
        getColumn={(card) => card.stage}
        getLabel={(card) => card.title}
        onMove={(card, to) => void moves.push(`${card.id}→${to}`)}
      >
        {(card) => <span>{card.title}</span>}
      </KanbanBoard>
    ));
    const handle = root.querySelector<HTMLButtonElement>('[aria-label="移动 写文档"]')!;
    handle.focus();
    await userEvent.keyboard(' ');
    await tick();
    expect(handle.getAttribute('aria-pressed')).toBe('true');
    await userEvent.keyboard('{Escape}');
    await tick();
    expect(handle.getAttribute('aria-pressed')).toBe('false');
    expect(moves).toEqual([]);
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{Enter}');
    await expect.poll(() => moves).toEqual(['a→doing']);
  });

  it('Drawer：Esc 先问 beforeClose，不同意时不关；拖宽手柄 ← / → 调宽、调窄', async () => {
    const asked: string[] = [];
    let allow = false;
    const widths: number[] = [];
    mount(
      _component(() => {
        let open = _state(true);
        let width = _state<number | null>(320);
        return () => (
          <Drawer
            _open={open}
            title="编辑项目"
            _width={width}
            onUpdate:_width={(next: number | null) => {
              width = next;
              if (next != null) widths.push(next);
            }}
            beforeClose={({ reason }) => {
              asked.push(reason);
              return allow;
            }}
          >
            内容
          </Drawer>
        );
      }),
    );
    const dialog = () => document.querySelector<HTMLDialogElement>('dialog');
    await expect.poll(() => dialog()?.open).toBe(true);
    const handle = dialog()!.querySelector<HTMLElement>('[role="separator"]')!;
    handle.focus();
    // 右侧抽屉的手柄在左边：← 调宽，→ 调窄
    await userEvent.keyboard('{ArrowLeft}');
    await expect.poll(() => widths.at(-1)).toBeGreaterThan(320);
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await expect.poll(() => widths.at(-1)).toBeLessThan(320);
    await userEvent.keyboard('{Escape}');
    await tick();
    expect(asked).toHaveLength(1);
    expect(dialog()?.open).toBe(true);
    allow = true;
    await userEvent.keyboard('{Escape}');
    await expect.poll(() => dialog()?.open ?? false).toBe(false);
  });

  it('ColorField：输入颜色后 Enter 写回', async () => {
    let color = '';
    const root = mount(
      _component(() => {
        let value = _state('#000000');
        return () => (
          <ColorField
            _value={value}
            onUpdate:_value={(next: string) => {
              value = next;
              color = next;
            }}
            aria-label="主色"
          />
        );
      }),
    );
    await userEvent.tripleClick(root.querySelector('input')!);
    await userEvent.keyboard('#3366ff{Enter}');
    expect(color).toBe('#3366ff');
  });

  it('Checkbox、Switch：空格切换', async () => {
    const root = mount(() => (
      <div>
        <Checkbox>同意条款</Checkbox>
        <Switch>接收通知</Switch>
      </div>
    ));
    const [checkbox, toggle] = [...root.querySelectorAll<HTMLInputElement>('input')];
    checkbox!.focus();
    await userEvent.keyboard(' ');
    expect(checkbox!.checked).toBe(true);
    await userEvent.tab();
    expect(focused()).toBe(toggle);
    await userEvent.keyboard(' ');
    expect(toggle!.checked).toBe(true);
  });
});
