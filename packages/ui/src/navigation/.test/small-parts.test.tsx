// 几个小组件：SkipLink 跳到主内容、PageJump 输入页码跳页、PageSizeSelect 换每页条数、TableOfContents 列出锚点、
// FormValue 写成隐藏输入框、ButtonGroup 一组按钮的外观、ResizeHandle 的方向键与读屏属性
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { Button } from '../../base/Button';
import { ButtonGroup } from '../../base/ButtonGroup';
import { FormValue } from '../../form/FormValue';
import { ResizeHandle } from '../../layout/ResizeHandle';
import { mount } from '../../utils/.test/mount';
import { PageJump } from '../PageJump';
import { PageSizeSelect } from '../PageSizeSelect';
import { SkipLink } from '../SkipLink';
import { TableOfContents } from '../TableOfContents';

const flush = async () => {
  for (let index = 0; index < 4; index++) await nextTick();
};

describe('小组件', () => {
  it('SkipLink：链到主内容的锚点，默认文字取文案', () => {
    const root = mount(() => <SkipLink href="#main" />);
    const link = root.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('#main');
    expect(link.textContent).toBe('跳到正文');
  });

  it('PageJump：输入页码回车跳过去，超出范围的夹到两端', async () => {
    let page = _state(1);
    const root = mount(() => <PageJump _page={page} pageCount={32} />);
    const input = root.querySelector('input')!;
    input.value = '5';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await flush();
    expect(page).toBe(5);
    input.value = '99';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await flush();
    expect(page).toBe(32);
  });

  it('PageSizeSelect：每页条数是一个下拉，触发框显示“N 条/页”', () => {
    const root = mount(() => <PageSizeSelect _value={20} options={[10, 20, 50]} />);
    expect(root.querySelector('[role="combobox"]')!.textContent).toContain('20');
  });

  it('TableOfContents：按层级列出链到锚点的链接', () => {
    const root = mount(() => (
      <TableOfContents
        items={[
          { id: 'install', label: '安装', level: 2 },
          { id: 'vite', label: '配置 Vite', level: 3 },
        ]}
      />
    ));
    const links = [...root.querySelectorAll('a')];
    expect(links.map((link) => [link.getAttribute('href'), link.textContent])).toEqual([
      ['#install', '安装'],
      ['#vite', '配置 Vite'],
    ]);
  });

  it('FormValue：数组写成几个同名的隐藏输入框，null 不写，disabled 时不提交', () => {
    const root = mount(() => (
      <form>
        <FormValue name="tags" value={['a', 'b']} />
        <FormValue name="empty" value={null} />
        <FormValue name="off" value="x" disabled />
      </form>
    ));
    const data = new FormData(root.querySelector('form')!);
    expect(data.getAll('tags')).toEqual(['a', 'b']);
    expect(data.has('empty')).toBe(false);
    expect(data.has('off')).toBe(false);
  });

  it('ButtonGroup：role="group"，里面的按钮连成一排', () => {
    const root = mount(() => (
      <ButtonGroup aria-label="对齐">
        <Button>左</Button>
        <Button>右</Button>
      </ButtonGroup>
    ));
    const group = root.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-label')).toBe('对齐');
    expect(group.querySelectorAll('button')).toHaveLength(2);
  });

  it('ResizeHandle：role="separator" 带当前宽度，方向键一次一个 step，不超出最小、最大', async () => {
    let width = 240;
    const root = mount(() => (
      <aside>
        <ResizeHandle
          aria-label="调整侧栏宽度"
          width={width}
          minWidth={200}
          maxWidth={300}
          step={40}
          onWidthChange={(px: number) => (width = px)}
        />
      </aside>
    ));
    const handle = root.querySelector<HTMLElement>('[role="separator"]')!;
    expect(handle.getAttribute('aria-valuenow')).toBe('240');
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(width).toBe(280);
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(width).toBe(200);
  });
});
