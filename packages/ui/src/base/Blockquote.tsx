/**
 * 引用（blockquote）：起始边一条竖线，次要文字色。提示、警告用 Alert，不用引用。
 *
 *   <Blockquote cite="https://…">…</Blockquote>
 *   <Blockquote source="《设计心理学》，唐纳德·诺曼">好的设计让人看得出该怎么用。</Blockquote>
 *
 * source 是给人看的出处（引用下面一行，前面带破折号，里面是 cite 元素）；cite 属性是给机器读的来源地址。
 * 部件：Root（blockquote）、Source（footer）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { partAttrs } from '../config/styles';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到 blockquote 上 */
export interface BlockquoteProps extends PartProps<'blockquote'> {
  /** 出处：作者、书名、来源的名字，显示在引用下面一行；要链接时自己放 Link */
  source?: VNodeChild;
  /** 出处那一行（footer）的部件属性 */
  propsSource?: PartProps<'footer'>;
  children?: VNodeChild;
}

/** Blockquote 的样式 */
const blockquoteStyles = css.create({
  root: {
    margin: 0,
    paddingBlock: '_xs',
    paddingInlineStart: '_lg',
    borderInlineStartWidth: '_md',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_borderStrong',
    color: '_textMuted',
  },
  // 出处：小一号，和引用隔开一点；书名、作者不用斜体（浏览器给 cite 的默认样式，中文里没有这个习惯）
  source: { display: 'block', marginBlockStart: '_xs', fontSize: '_sm' },
  cite: { fontStyle: 'normal' },
});

/** 部件的标记（data-scope="blockquote"） */
const blockquotePart = (part: string) => partAttrs({ name: 'Blockquote' }, part);

/** 引用（blockquote）：可以带出处 */
export const Blockquote = _component(
  ({ source, propsSource, children, ...rest }: BlockquoteProps) =>
    () => (
      <blockquote {...mergeAttrs<'blockquote'>({ sx: blockquoteStyles.root }, rest)}>
        {children}
        {hasContent(source) && (
          <footer
            {...mergeAttrs<'footer'>(
              { sx: blockquoteStyles.source, ...blockquotePart('source') },
              propsSource,
            )}
          >
            {'— '}
            <cite {...css.attrs(blockquoteStyles.cite)}>{source}</cite>
          </footer>
        )}
      </blockquote>
    ),
);
