// 树的展开成行、勾选的父子联动（半选、懒加载出来的子节点跟随父节点）
import { describe, expect, it } from 'vitest';
import { checkStates, flattenTree, indexTree, toggleChecked, type TreeAccessors } from '../tree';

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
