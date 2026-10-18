/**
 * 限制内容最大宽度并水平居中：页面主体、表单页、文章。
 *
 *   <Container size="md" as="main">…</Container>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { elementProps, mergeProps, type AsProps } from '../utils/props';
import type { Space } from '../utils/styles';

type Tags = 'div' | 'section' | 'main' | 'article' | 'header' | 'footer';

/** 容器最大宽度档位，对应主题 sizes 的容器宽度（rem，跟随浏览器字号），括号里是默认主题的值 */
export interface ContainerSizes {
  /** 30rem（480px）：窄内容，如登录表单 */
  xs: unknown;
  /** 40rem（640px）：表单页、设置页 */
  sm: unknown;
  /** 48rem（768px）：文章、详情页 */
  md: unknown;
  /** 64rem（1024px）：常规页面（默认） */
  lg: unknown;
  /** 80rem（1280px）：宽表格、仪表盘 */
  xl: unknown;
}

export interface ContainerProps extends AsProps<Tags> {
  /** 最大宽度档位，对应主题 sizes 的容器宽度（30/40/48/64/80rem），默认 lg */
  size?: keyof ContainerSizes;
  /** 左右内边距档位，对应主题的 space，默认 lg；窄屏时内容不会贴边 */
  padding?: Space;
  children?: VNodeChild;
}

const styles = stylex.create({
  root: { boxSizing: 'border-box', width: '_full', marginInline: 'auto' },
});

const sizeStyles = stylex.create({
  xs: { maxWidth: '_xs' },
  sm: { maxWidth: '_sm' },
  md: { maxWidth: '_md' },
  lg: { maxWidth: '_lg' },
  xl: { maxWidth: '_xl' },
});

const paddingStyles = stylex.create({
  none: { paddingInline: '_none' },
  xs: { paddingInline: '_xs' },
  sm: { paddingInline: '_sm' },
  md: { paddingInline: '_md' },
  lg: { paddingInline: '_lg' },
  xl: { paddingInline: '_xl' },
});

export const Container = _component(
  ({ as = 'div', size = 'lg', padding = 'lg', children, ...rest }: ContainerProps) =>
    () => {
      const Tag = as;
      const sx = [styles.root, sizeStyles[size], paddingStyles[padding]];
      return <Tag {...elementProps(mergeProps<Tags>({ sx }, rest))}>{children}</Tag>;
    },
);
