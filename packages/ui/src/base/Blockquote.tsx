/**
 * 引用（blockquote）：起始边一条竖线，次要文字色。提示、警告用 Alert，不用引用。
 *
 *   <Blockquote cite="https://…">…</Blockquote>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到 blockquote 上 */
export interface BlockquoteProps extends PartProps<'blockquote'> {
  children?: VNodeChild;
}

/** Blockquote 的样式 */
export const blockquoteStyles = css.create({
  root: {
    margin: 0,
    paddingBlock: '_xs',
    paddingInlineStart: '_lg',
    borderInlineStartWidth: '_md',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_borderStrong',
    color: '_textMuted',
  },
});

/** 引用（blockquote） */
export const Blockquote = _component(({ children, ...rest }: BlockquoteProps) => () => (
  <blockquote {...mergeAttrs<'blockquote'>({ sx: blockquoteStyles.root }, rest)}>
    {children}
  </blockquote>
));
