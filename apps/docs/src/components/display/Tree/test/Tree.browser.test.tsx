// Tree 在真实浏览器里：写 maxHeight 时节点少按内容高（不留空白），节点多了到上限再在树里滚动
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Tree } from '@zerodep-dev/vue-tsx-pro-ui';
import { expect, it } from 'vitest';
import { mount } from '../../../../test/mount';

interface Node {
  id: string;
}

const styles = css.create({ tree: { maxHeight: '16rem' } });
const nodes = (count: number): Node[] => Array.from({ length: count }, (_, i) => ({ id: `n${i}` }));

it('maxHeight：3 个节点时按内容高，200 个节点时正好 16rem 并能滚动', async () => {
  const root = mount(
    _component(() => () => (
      <div>
        {[3, 200].map((count) => (
          <Tree
            key={count}
            items={nodes(count)}
            getKey={(node) => node.id}
            getLabel={(node) => node.id}
            getChildren={() => undefined}
            aria-label={`${count} 个节点`}
            sx={styles.tree}
          />
        ))}
      </div>
    )),
  );
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const [few, many] = [...root.querySelectorAll<HTMLElement>('[role="tree"]')];
  await expect.poll(() => few!.querySelectorAll('[role="treeitem"]').length).toBe(3);
  expect(few!.getBoundingClientRect().height).toBeLessThan(8 * rem);
  expect(Math.abs(many!.getBoundingClientRect().height - 16 * rem)).toBeLessThan(1);
  expect(many!.scrollHeight).toBeGreaterThan(many!.clientHeight);
});
