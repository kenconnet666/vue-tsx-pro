/**
 * 限制内容最大宽度并水平居中：页面主体、表单页、文章。
 * 一个元素一个组件（COMPONENTS.md §1）：Container 是 div；main、article 等语义容器用 createContainer 生成。
 *
 *   <Container size="md">…</Container>
 *   const Page = createContainer('main', 'Page');
 */
import { _component, type TsxComponent } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import type { LayoutTag, Space } from '../utils/style/styles';

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

/** 容器的选项，Container 与 createContainer 生成的组件共用 */
export interface ContainerOptions {
  /** 最大宽度档位，对应主题 sizes 的容器宽度（30/40/48/64/80rem），默认 lg */
  size?: keyof ContainerSizes;
  /** 左右内边距档位，对应主题的 space，默认 lg；窄屏时内容不会贴边 */
  padding?: Space;
  children?: VNodeChild;
}

/** 未声明的属性落到元素上：Container 为 div，createContainer 生成的为给定的标签 */
export type ContainerProps<Tag extends LayoutTag = 'div'> = PartProps<Tag> & ContainerOptions;

/** Container 的样式：root */
export const containerStyles = css.create({
  root: { boxSizing: 'border-box', width: '_full', marginInline: 'auto' },
});

/** Container 的样式：xs、sm、md、lg、xl */
export const containerSizeStyles = css.create({
  xs: { maxWidth: '_xs' },
  sm: { maxWidth: '_sm' },
  md: { maxWidth: '_md' },
  lg: { maxWidth: '_lg' },
  xl: { maxWidth: '_xl' },
});

/** Container 的样式：none、xs、sm、md、lg、xl */
export const containerPaddingStyles = css.create({
  none: { paddingInline: '_none' },
  xs: { paddingInline: '_xs' },
  sm: { paddingInline: '_sm' },
  md: { paddingInline: '_md' },
  lg: { paddingInline: '_lg' },
  xl: { paddingInline: '_xl' },
});

/** 生成渲染为指定语义标签（main、section、article…）的容器组件；name 是 DevTools 里显示的组件名 */
export function createContainer<Tag extends LayoutTag>(
  tag: Tag,
  name: string,
): TsxComponent<ContainerProps<Tag>> {
  // 实现按布局标签共有的属性写，对外每个组件只接受自己元素的属性
  return _component(
    ({ size = 'lg', padding = 'lg', children, ...rest }: ContainerProps<LayoutTag>) =>
      () => {
        const Tag = tag as LayoutTag;
        const sx = [
          containerStyles.root,
          containerSizeStyles[size],
          containerPaddingStyles[padding],
        ];
        return <Tag {...mergeAttrs<LayoutTag>({ sx }, rest)}>{children}</Tag>;
      },
    { name },
  ) as unknown as TsxComponent<ContainerProps<Tag>>;
}

/** 限宽居中的容器（div） */
export const Container = createContainer('div', 'Container');
