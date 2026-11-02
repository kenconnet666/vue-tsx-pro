// useHeadings：收集正文里的标题，增删标题时重新收集，结果没变不更新
import { describe, expect, it } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import { useHeadings } from '../scroll-spy';

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe('useHeadings', () => {
  it('收集带 id 的标题，增加标题后跟着变', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<h2 id="a">甲</h2><h3 id="b">乙</h3><h2>没有 id</h2>';
    const target = shallowRef<HTMLElement | null>(null);
    const headings = useHeadings(() => target.value);
    expect(headings.value).toEqual([]);
    target.value = root;
    await nextTick();
    await frame();
    expect(headings.value.map((heading) => heading.id)).toEqual(['a', 'b']);

    const before = headings.value;
    root.append(document.createElement('p'));
    await nextTick();
    await frame();
    expect(headings.value).toBe(before);

    const added = document.createElement('h2');
    added.id = 'c';
    added.textContent = '丙';
    root.append(added);
    await nextTick();
    await frame();
    await frame();
    expect(headings.value.map((heading) => heading.id)).toEqual(['a', 'b', 'c']);
  });

  it('selector 决定收集哪些标题', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<h2 id="a" class="keep">甲</h2><h2 id="b">乙</h2>';
    const headings = useHeadings(() => root, 'h2.keep');
    await nextTick();
    await frame();
    expect(headings.value.map((heading) => heading.id)).toEqual(['a']);
  });
});
