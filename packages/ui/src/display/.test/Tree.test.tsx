// Tree：treeitem 的层级属性、方向键展开 / 收起 / 进出子节点、选中、勾选联动、懒加载
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Tree } from '../Tree';

// happy-dom 不排版：给滚动容器一个 400px 的视口（节点是虚拟滚动的）
const clientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')!;
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { get: () => 400 });
});
afterAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', clientHeight);
});

interface Node {
  id: string;
  name: string;
  children?: Node[];
  lazy?: boolean;
}

const data: Node[] = [
  {
    id: 'src',
    name: 'src',
    children: [
      { id: 'main', name: 'main.ts' },
      { id: 'app', name: 'App.tsx' },
    ],
  },
  { id: 'readme', name: 'README.md' },
];

const flush = async () => {
  for (let i = 0; i < 3; i++) await nextTick();
};
const key = (element: HTMLElement, name: string) =>
  element.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
const items = (root: Element) => [...root.querySelectorAll<HTMLElement>('[role="treeitem"]')];
const activeLabel = (tree: HTMLElement) =>
  document.getElementById(tree.getAttribute('aria-activedescendant') ?? '')?.textContent;

function renderTree(props: Record<string, unknown> = {}) {
  const root = mount(() => (
    <Tree
      items={data}
      getKey={(node: Node) => node.id}
      getLabel={(node: Node) => node.name}
      getChildren={(node: Node) => node.children}
      aria-label="文件"
      {...props}
    />
  ));
  return { root, tree: root.querySelector<HTMLElement>('[role="tree"]')! };
}

describe('Tree', () => {
  it('treeitem 带层级、同级位置；可展开的带 aria-expanded', async () => {
    const { root } = renderTree({ expanded: ['src'] });
    await flush();
    const [src, main] = items(root);
    expect(src!.getAttribute('aria-expanded')).toBe('true');
    expect(main!.getAttribute('aria-level')).toBe('2');
    expect(main!.getAttribute('aria-posinset')).toBe('1');
    expect(main!.getAttribute('aria-setsize')).toBe('2');
    expect(main!.hasAttribute('aria-expanded')).toBe(false);
  });

  it('→ 展开、再按进入第一个子节点；← 回到父节点、再按收起', async () => {
    let open = _state<string[]>([]);
    const root = mount(() => (
      <Tree
        items={data}
        getKey={(node) => node.id}
        getLabel={(node) => node.name}
        getChildren={(node) => node.children}
        expanded={_bind(open)}
        aria-label="文件"
      />
    ));
    await flush();
    const tree = root.querySelector<HTMLElement>('[role="tree"]')!;
    tree.dispatchEvent(new FocusEvent('focus'));
    await flush();
    expect(activeLabel(tree)).toBe('src');
    key(tree, 'ArrowRight');
    await flush();
    expect(open).toEqual(['src']);
    key(tree, 'ArrowRight');
    await flush();
    expect(activeLabel(tree)).toBe('main.ts');
    key(tree, 'ArrowLeft');
    await flush();
    expect(activeLabel(tree)).toBe('src');
    key(tree, 'ArrowLeft');
    await flush();
    expect(open).toEqual([]);
    key(tree, 'r');
    await flush();
    expect(activeLabel(tree)).toBe('README.md');
  });

  it('单选：Enter 选中当前项，aria-selected 跟着变', async () => {
    let selected = _state<string[]>([]);
    const root = mount(() => (
      <Tree
        items={data}
        getKey={(node) => node.id}
        getLabel={(node) => node.name}
        getChildren={(node) => node.children}
        selectionMode="single"
        selected={_bind(selected)}
        aria-label="文件"
      />
    ));
    await flush();
    const tree = root.querySelector<HTMLElement>('[role="tree"]')!;
    tree.dispatchEvent(new FocusEvent('focus'));
    key(tree, 'ArrowDown');
    key(tree, 'Enter');
    await flush();
    expect(selected).toEqual(['readme']);
    expect(items(root)[1]!.getAttribute('aria-selected')).toBe('true');
  });

  it('勾选：空格勾上父节点时子节点一起勾上；只勾一个子节点时父节点半选', async () => {
    let checked = _state<string[]>([]);
    const root = mount(() => (
      <Tree
        items={data}
        getKey={(node) => node.id}
        getLabel={(node) => node.name}
        getChildren={(node) => node.children}
        expanded={['src']}
        checkable
        checked={_bind(checked)}
        aria-label="文件"
      />
    ));
    await flush();
    const tree = root.querySelector<HTMLElement>('[role="tree"]')!;
    tree.dispatchEvent(new FocusEvent('focus'));
    key(tree, ' ');
    await flush();
    expect(checked).toEqual(['src', 'main', 'app']);
    key(tree, 'ArrowDown');
    key(tree, ' ');
    await flush();
    expect(checked).toEqual(['app']);
    expect(items(root)[0]!.getAttribute('aria-checked')).toBe('mixed');
  });

  it('懒加载：展开还没有子节点的节点时调用 loadChildren，加载中带 aria-busy', async () => {
    let resolve!: () => void;
    const lazy: Node[] = [{ id: 'remote', name: 'remote', lazy: true }];
    const root = mount(() => (
      <Tree
        items={lazy}
        getKey={(node) => node.id}
        getLabel={(node) => node.name}
        getChildren={(node) => node.children}
        hasChildren={(node) => node.lazy ?? false}
        loadChildren={() => new Promise<void>((done) => (resolve = done))}
        aria-label="远程"
      />
    ));
    await flush();
    items(root)[0]!.click();
    await flush();
    expect(items(root)[0]!.getAttribute('aria-busy')).toBe('true');
    resolve();
    await flush();
    expect(items(root)[0]!.hasAttribute('aria-busy')).toBe(false);
  });
});
