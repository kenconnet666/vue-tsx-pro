/**
 * 行内代码：等宽字体、浅底。多行代码用 CodeBlock。
 *
 *   运行 <Code>pnpm install</Code> 安装依赖
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type PartProps } from '../utils/props';
import type { StyleTable } from '../utils/style/styles';

/** 未声明的属性落到 code 上 */
export interface CodeProps extends PartProps<'code'> {
  children?: VNodeChild;
}

/** Code 的样式：root */
export const codeStyles: StyleTable<'root'> = stylex.create({
  root: {
    paddingInline: '_xs',
    borderRadius: '_sm',
    backgroundColor: '_fill',
    color: '_text',
    fontFamily: '_mono',
    // 相对周围文字略小：等宽字体的字面显得大；是比例不是字号档位
    fontSize: '0.9em',
    // 长命令、长路径可以在任意位置换行，不撑破容器
    overflowWrap: 'anywhere',
  },
});

/** 行内代码（code）：命令、文件名、标识符；等宽字体，长内容可在任意位置换行 */
export const Code = _component(({ children, ...rest }: CodeProps) => () => (
  <code {...elementProps(mergeProps<'code'>({ sx: codeStyles.root }, rest))}>{children}</code>
));
