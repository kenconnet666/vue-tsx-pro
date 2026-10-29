/**
 * 高亮标记（mark）：搜索命中、正文里要强调的词。底色取主题的 highlight，文字颜色不变。
 *
 *   <Mark>vue-tsx-pro</Mark> 的组件
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到 mark 上 */
export interface MarkProps extends PartProps<'mark'> {
  children?: VNodeChild;
}

/** Mark 的样式 */
export const markStyles = css.create({
  root: {
    paddingInline: '0.15em',
    borderRadius: '_xs',
    backgroundColor: '_highlight',
    color: 'inherit',
  },
});

/** 高亮标记（mark） */
export const Mark = _component(({ children, ...rest }: MarkProps) => () => (
  <mark {...mergeAttrs<'mark'>({ sx: markStyles.root }, rest)}>{children}</mark>
));
