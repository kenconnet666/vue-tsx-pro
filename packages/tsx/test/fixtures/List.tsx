import type { VNodeChild } from 'vue';
import { _component } from '../../src';

interface ListProps<T> {
  items: T[];
  /** 渲染函数作为子节点：<List items={…}>{(item) => …}</List> */
  children: (item: T, index: number) => VNodeChild;
}

export const List = _component(<T,>({ items, children }: ListProps<T>) => {
  return () => (
    <ul>
      {items.map((item, index) => (
        <li>{children(item, index)}</li>
      ))}
    </ul>
  );
});

/** 把渲染函数原样转交给 List */
export const ForwardList = _component(<T,>({ items, children }: ListProps<T>) => {
  return () => <List items={items}>{children}</List>;
});
