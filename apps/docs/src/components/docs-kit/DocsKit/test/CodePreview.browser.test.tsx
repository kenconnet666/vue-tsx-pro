// CodePreview、Collapse 在真实浏览器里：窄容器（竖屏手机）里展开源码后，代码块和容器一样宽、长行在里面横向滚动，
// 不被最长的一行撑到比容器还宽（外层一裁就既看不全也滚不了）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, CodeBlock, Collapse } from '@zerodep-dev/vue-tsx-pro-ui';
import { CodePreview } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';

const WIDTH = 320;
const code = `export default _component(() => () => (\n  <Flex key={variant} direction="column" align="start" gap="xs" wrap justify="between">{'很长的一行'.repeat(12)}</Flex>\n));\n`;

/** 代码块里真正滚动的那一层 */
function scrollerOf(root: Element): HTMLElement {
  let element: HTMLElement | null = root.querySelector('pre');
  while (element && !/(auto|scroll)/.test(getComputedStyle(element).overflowX))
    element = element.parentElement;
  return element!;
}

it('CodePreview：展开源码后代码块不比卡片宽，长行可以横向滚动', async () => {
  const root = mount(
    _component(() => () => (
      <div style={{ width: `${WIDTH}px` }}>
        <CodePreview code={code} _showCode>
          <Button>保存</Button>
        </CodePreview>
      </div>
    )),
  );
  await expect
    .poll(() => root.querySelector('pre')?.getBoundingClientRect().width ?? 0)
    .toBeGreaterThan(0);
  const scroller = scrollerOf(root);
  expect(scroller.clientWidth).toBeLessThanOrEqual(WIDTH);
  expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
  scroller.scrollLeft = 200;
  expect(scroller.scrollLeft).toBe(200);
});

it('Collapse：展开后内容区和容器一样宽，里面的宽内容自己滚动', async () => {
  const root = mount(
    _component(() => () => (
      <div style={{ width: `${WIDTH}px` }}>
        <Collapse _open>
          <CodeBlock code={code} lang="tsx" />
        </Collapse>
      </div>
    )),
  );
  await expect
    .poll(() => root.querySelector('pre')?.getBoundingClientRect().width ?? 0)
    .toBeGreaterThan(0);
  const collapse = root.firstElementChild!.firstElementChild!;
  expect(collapse.getBoundingClientRect().width).toBe(WIDTH);
  expect(collapse.firstElementChild!.getBoundingClientRect().width).toBe(WIDTH);
  const scroller = scrollerOf(root);
  expect(scroller.clientWidth).toBeLessThanOrEqual(WIDTH);
  expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
});
