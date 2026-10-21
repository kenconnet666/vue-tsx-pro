// 内容处理：plainText 只在内容全是文字时拼出文字；childNodes 把数组与 Fragment 展开成一层，去掉空值与注释
import { describe, expect, it } from 'vitest';
import { Comment, createCommentVNode, createTextVNode, Fragment, h } from 'vue';
import { childNodes, plainText } from '../text';

describe('plainText', () => {
  it('字符串、数字、文字节点与它们的数组拼成文字', () => {
    expect(plainText('上海')).toBe('上海');
    expect(plainText(42)).toBe('42');
    expect(plainText(['共 ', 3, createTextVNode(' 项')])).toBe('共 3 项');
  });

  it('有元素、组件或空值时返回 undefined（拼不出可靠的名称）', () => {
    expect(plainText(h('b', '上海'))).toBeUndefined();
    expect(plainText(['上海', h('i')])).toBeUndefined();
    expect(plainText(null)).toBeUndefined();
  });
});

describe('childNodes', () => {
  it('数组与 Fragment 拆开；null、布尔、注释去掉；文字变成文字节点', () => {
    const nodes = childNodes([
      h('span', 'a'),
      null,
      false,
      createCommentVNode('v-if'),
      h(Fragment, [h('span', 'b'), [h('span', 'c')]]),
      '文字',
    ]);
    expect(nodes.map((node) => (node.type === 'span' ? node.children : node.type))).toEqual([
      'a',
      'b',
      'c',
      expect.anything(),
    ]);
    expect(nodes.at(-1)!.children).toBe('文字');
    expect(nodes.some((node) => node.type === Comment)).toBe(false);
  });
});
