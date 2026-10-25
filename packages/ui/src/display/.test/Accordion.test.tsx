// Accordion：单开 / 多开、标题与内容的关联、方向键在标题之间移动、页内搜索命中时写回
import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Accordion, AccordionItem } from '../Accordion';

const triggers = (root: Element) => [...root.querySelectorAll<HTMLButtonElement>('button')];
const key = (element: HTMLElement, name: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));

describe('Accordion', () => {
  it('标题是 heading 里的按钮，内容是以标题为名称的 region', () => {
    const root = mount(() => (
      <Accordion _value="a" headingLevel={4}>
        <AccordionItem value="a" title="多久发货">
          48 小时
        </AccordionItem>
      </Accordion>
    ));
    const [button] = triggers(root);
    expect(button!.parentElement!.tagName).toBe('H4');
    expect(button!.getAttribute('aria-expanded')).toBe('true');
    const region = document.getElementById(button!.getAttribute('aria-controls')!)!;
    expect(region.getAttribute('role')).toBe('region');
    expect(region.getAttribute('aria-labelledby')).toBe(button!.id);
  });

  it('单开：点另一项时前一项收起；collapsible 为 false 时最后一项不能收起', async () => {
    let open = _state<string | null>('a');
    const root = mount(() => (
      <Accordion _value={open} collapsible={false}>
        <AccordionItem value="a" title="A">
          1
        </AccordionItem>
        <AccordionItem value="b" title="B">
          2
        </AccordionItem>
      </Accordion>
    ));
    const [a, b] = triggers(root);
    b!.click();
    expect(open).toBe('b');
    b!.click();
    expect(open).toBe('b');
    await nextTick();
    expect(a!.getAttribute('aria-expanded')).toBe('false');
  });

  it('多开：各自切换；不可用的项点不动', () => {
    let open = _state<string[]>([]);
    const root = mount(() => (
      <Accordion selectionMode="multiple" _value={open}>
        <AccordionItem value="a" title="A">
          1
        </AccordionItem>
        <AccordionItem value="b" title="B">
          2
        </AccordionItem>
        <AccordionItem value="c" title="C" disabled>
          3
        </AccordionItem>
      </Accordion>
    ));
    const [a, b, c] = triggers(root);
    a!.click();
    b!.click();
    c!.click();
    expect(open).toEqual(['a', 'b']);
  });

  it('↑ / ↓ 在标题之间循环移动（跳过不可用的），Home / End 到两端', () => {
    const root = mount(() => (
      <Accordion>
        <AccordionItem value="a" title="A">
          1
        </AccordionItem>
        <AccordionItem value="b" title="B" disabled>
          2
        </AccordionItem>
        <AccordionItem value="c" title="C">
          3
        </AccordionItem>
      </Accordion>
    ));
    const [a, , c] = triggers(root);
    a!.focus();
    key(a!, 'ArrowDown');
    expect(document.activeElement).toBe(c);
    key(c!, 'ArrowDown');
    expect(document.activeElement).toBe(a);
    key(a!, 'End');
    expect(document.activeElement).toBe(c);
    key(c!, 'Home');
    expect(document.activeElement).toBe(a);
  });

  it('页内搜索命中收起的内容（beforematch）时展开并写回', async () => {
    let open = _state<string | null>(null);
    const root = mount(() => (
      <Accordion _value={open}>
        <AccordionItem value="a" title="A">
          隐藏的关键词
        </AccordionItem>
      </Accordion>
    ));
    const region = root.querySelector('[role="region"]')!;
    region.dispatchEvent(new Event('beforematch'));
    await nextTick();
    expect(open).toBe('a');
  });
});
