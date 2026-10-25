// 树的展开成行、勾选的父子联动（半选、懒加载出来的子节点跟随父节点）、勾选结果的取法、路径、搜索过滤、移动节点
import { describe, expect, it } from 'vitest';
import {
  buildTree,
  checkedByStrategy,
  checkStates,
  filterTree,
  flattenTree,
  indexTree,
  moveNode,
  toggleChecked,
  treePath,
  type TreeAccessors,
  type TreeEditor,
} from '../tree';

interface Node {
  id: string;
  children?: Node[];
  lazy?: boolean;
}

const accessors: TreeAccessors<Node> = {
  getKey: (node) => node.id,
  getChildren: (node) => node.children,
  hasChildren: (node) => node.lazy ?? (node.children?.length ?? 0) > 0,
};

const tree: Node[] = [
  { id: 'a', children: [{ id: 'a1' }, { id: 'a2', children: [{ id: 'a2x' }] }] },
  { id: 'b', lazy: true },
];

describe('flattenTree', () => {
  it('只展开 expanded 里的节点；层级、同级总数与位置', () => {
    const rows = flattenTree(tree, accessors, new Set(['a']));
    expect(rows.map((row) => row.key)).toEqual(['a', 'a1', 'a2', 'b']);
    expect(rows[2]).toMatchObject({ depth: 1, parent: 'a', setSize: 2, position: 2 });
    expect(rows[3]).toMatchObject({ expandable: true, depth: 0 });
    expect(rows[1]!.expandable).toBe(false);
  });
});

describe('勾选联动', () => {
  const index = indexTree(tree, accessors);

  it('勾上父节点勾上全部子孙；子节点全勾上时父节点也勾上', () => {
    expect(toggleChecked(index, [], 'a')).toEqual(['a', 'a1', 'a2', 'a2x']);
    expect(toggleChecked(index, ['a1'], 'a2x')).toEqual(['a', 'a1', 'a2', 'a2x']);
  });

  it('取消一个子节点时祖先跟着取消，其余兄弟保留', () => {
    expect(toggleChecked(index, ['a'], 'a2x')).toEqual(['a1']);
  });

  it('只勾了一部分时父节点半选', () => {
    const states = checkStates(index, ['a2x']);
    expect(states.get('a2')).toBe('checked');
    expect(states.get('a')).toBe('indeterminate');
    expect(states.get('a1')).toBe('unchecked');
    expect(states.get('b')).toBe('unchecked');
    // a2 的子节点全勾上，显示为勾上；再点它就是取消
    expect(toggleChecked(index, ['a2x'], 'a2')).toEqual([]);
  });

  it('父节点勾上之后懒加载出来的子节点也算勾上', () => {
    const loaded: Node[] = [tree[0]!, { id: 'b', children: [{ id: 'b1' }, { id: 'b2' }] }];
    const next = indexTree(loaded, accessors);
    expect(checkStates(next, ['b']).get('b1')).toBe('checked');
    expect(toggleChecked(next, ['b'], 'b1')).toEqual(['b2']);
  });
});

describe('勾选结果的取法', () => {
  const index = indexTree(tree, accessors);
  const checked = toggleChecked(index, [], 'a2');
  it('all：勾上的全部；parent：父节点全勾上时只要父节点；child：只要叶子', () => {
    expect(checkedByStrategy(index, checked, 'all')).toEqual(['a2', 'a2x']);
    expect(checkedByStrategy(index, checked, 'parent')).toEqual(['a2']);
    expect(checkedByStrategy(index, checked, 'child')).toEqual(['a2x']);
    const all = toggleChecked(index, [], 'a');
    expect(checkedByStrategy(index, all, 'parent')).toEqual(['a']);
    expect(checkedByStrategy(index, all, 'child')).toEqual(['a1', 'a2x']);
  });
});

describe('treePath', () => {
  it('从第一层到节点的各个 key；不在树里时为空', () => {
    const index = indexTree(tree, accessors);
    expect(treePath(index, 'a2x')).toEqual(['a', 'a2', 'a2x']);
    expect(treePath(index, 'b')).toEqual(['b']);
    expect(treePath(index, 'nope')).toEqual([]);
  });
});

describe('filterTree', () => {
  it('留下匹配的节点与祖先、展开祖先；匹配节点的子孙不跟着留下', () => {
    const result = filterTree(tree, accessors, (node) => node.id.startsWith('a2'));
    expect([...result.include]).toEqual(expect.arrayContaining(['a', 'a2', 'a2x']));
    expect(result.include.has('a1')).toBe(false);
    expect([...result.expand].sort()).toEqual(['a', 'a2']);
    const rows = flattenTree(tree, accessors, result.expand, { include: result.include });
    expect(rows.map((row) => row.key)).toEqual(['a', 'a2', 'a2x']);
    // 同级的总数与位置按过滤后的算
    expect(rows[1]).toMatchObject({ setSize: 1, position: 1 });

    const parentOnly = filterTree(tree, accessors, (node) => node.id === 'a');
    expect([...parentOnly.include]).toEqual(['a']);
  });
});

describe('moveNode', () => {
  const editor: TreeEditor<Node> = {
    ...accessors,
    withChildren: (node, children) => ({ ...node, children }),
  };
  const keys = (nodes: Node[]): unknown =>
    nodes.map((node) => (node.children?.length ? { [node.id]: keys(node.children) } : node.id));

  it('移到别的父节点下的指定位置；不改原数据，没动到的节点原样复用', () => {
    const moved = moveNode(tree, editor, 'a2x', { parent: 'a', index: 0 })!;
    expect(keys(moved)).toEqual([{ a: ['a2x', 'a1', 'a2'] }, 'b']);
    expect(keys(tree)).toEqual([{ a: ['a1', { a2: ['a2x'] }] }, 'b']);
    expect(moved[1]).toBe(tree[1]);
  });

  it('移到第一层、同级里换位置（位置按移走之后算）', () => {
    expect(keys(moveNode(tree, editor, 'a1', { parent: undefined, index: 2 })!)).toEqual([
      { a: [{ a2: ['a2x'] }] },
      'b',
      'a1',
    ]);
    expect(keys(moveNode(tree, editor, 'b', { parent: undefined, index: 0 })!)).toEqual([
      'b',
      { a: ['a1', { a2: ['a2x'] }] },
    ]);
  });

  it('移到自己或自己的子孙下面、key 不存在时返回 null', () => {
    expect(moveNode(tree, editor, 'a', { parent: 'a2', index: 0 })).toBeNull();
    expect(moveNode(tree, editor, 'a', { parent: 'a', index: 0 })).toBeNull();
    expect(moveNode(tree, editor, 'zz', { parent: undefined, index: 0 })).toBeNull();
  });
});

describe('buildTree：平铺的行组装成树', () => {
  interface Row {
    id: string;
    parentId: string | null;
    name: string;
  }
  const rows: Row[] = [
    { id: 'b1', parentId: 'b', name: '小组' },
    { id: 'a', parentId: null, name: '研发' },
    { id: 'b', parentId: null, name: '采购' },
    { id: 'a1', parentId: 'a', name: '前端' },
    { id: 'x', parentId: 'gone', name: '父行不在这批里' },
  ];
  const read = { getKey: (r: Row) => r.id, getParent: (r: Row) => r.parentId };

  it('同级保持原来的顺序，父行不在这批里的当作根，叶子的 children 是空数组', () => {
    const tree = buildTree(rows, read) as (Row & { children: Row[] })[];
    const shape = (nodes: (Row & { children: Row[] })[]): unknown[] =>
      nodes.map((n) => (n.children.length ? { [n.id]: shape(n.children as never) } : n.id));
    expect(shape(tree)).toEqual([{ a: ['a1'] }, { b: ['b1'] }, 'x']);
    expect(rows[1]).not.toHaveProperty('children');
  });

  it('withChildren 决定节点的样子；搜索结果组装后交给 filterTree', () => {
    const tree = buildTree(rows, {
      ...read,
      withChildren: (r, children) => ({ ...r, kids: children }) as Row,
    });
    const accessors = {
      getKey: (r: Row) => r.id,
      getChildren: (r: Row) => (r as Row & { kids: Row[] }).kids,
    };
    const { expand, matched } = filterTree(tree, accessors, (r) => r.name === '前端');
    expect([...expand, ...matched]).toEqual(['a', 'a1']);
  });

  it('key 重复或父子成环时报错', () => {
    expect(() => buildTree([rows[1]!, rows[1]!], read)).toThrow(/出现了两次/);
    const loop: Row[] = [
      { id: 'p', parentId: 'q', name: '' },
      { id: 'q', parentId: 'p', name: '' },
    ];
    expect(() => buildTree(loop, read)).toThrow(/成了环/);
  });
});
