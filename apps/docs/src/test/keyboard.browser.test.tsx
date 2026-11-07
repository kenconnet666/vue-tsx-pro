// 键盘：真实浏览器里按键操作有自己键盘逻辑的组件（达标矩阵的浏览器测试一项）。
// Accordion 的方向键与 Home / End，NumberField 的 ↑ / ↓ / PageUp，Mentions 的 @ 与 ↓ Enter，FloatButtonGroup 速拨的 Esc，
// Menu 里 MenuSub 的 → 与 ←，ResizeHandle 的方向键，DateField 的分段（DateSegmentGroup）↑ 与 →，CommentComposer 的 Ctrl+Enter
import { Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Accordion,
  AccordionItem,
  Button,
  DateField,
  Field,
  Menu,
  MenuItem,
  MenuSub,
  Mentions,
  NumberField,
  ResizeHandle,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { FloatButton, FloatButtonGroup } from '@zerodep-dev/vue-tsx-pro-ui';
import { CommentComposer } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { mount } from './mount';

const tick = () => new Promise((resolve) => setTimeout(resolve, 60));
const focused = () => document.activeElement as HTMLElement | null;

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
});
