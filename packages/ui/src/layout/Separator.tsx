/**
 * 分隔线。默认是装饰性的（对读屏隐藏）；分隔的是两组不同的内容、需要读屏感知时设 decorative={false}，
 * 渲染为 role="separator"（竖向时带 aria-orientation）。
 *
 *   <Separator />
 *   <Flex align="center" gap="sm">A<Separator orientation="vertical" />B</Flex>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 角色与朝向由组件管理 */
export type SeparatorManaged = 'role' | 'aria-orientation' | 'aria-hidden';

/** 分隔线方向 */
export interface SeparatorOrientations {
  /** 横线：上下两部分之间，占满容器宽度（默认） */
  horizontal: unknown;
  /** 竖线：左右两部分之间，在 flex 容器里随行高拉伸 */
  vertical: unknown;
}

/** 未声明的属性落到 div 上 */
export interface SeparatorProps extends PartProps<'div', SeparatorManaged> {
  /** 方向，默认 horizontal */
  orientation?: keyof SeparatorOrientations;
  /** 是否只是视觉装饰，默认 true：对读屏隐藏 */
  decorative?: boolean;
}

/** Separator 的样式：root、horizontal、vertical */
export const separatorStyles = stylex.create({
  root: { flexShrink: 0, backgroundColor: '_borderMuted' },
  horizontal: { height: '_borderWidths.xs', width: '_full' },
  // 在 flex 容器里随行高拉伸
  vertical: { width: '_borderWidths.xs', alignSelf: 'stretch' },
});

/** 分隔线（div）：默认装饰性、对读屏隐藏；decorative={false} 时为 role="separator" */
export const Separator = _component(
  ({ orientation = 'horizontal', decorative = true, ...rest }: SeparatorProps) =>
    () => (
      <div
        {...mergeAttrs<'div'>({ sx: [separatorStyles.root, separatorStyles[orientation]] }, rest, {
          role: decorative ? 'none' : 'separator',
          'aria-orientation': !decorative && orientation === 'vertical' ? 'vertical' : undefined,
          'aria-hidden': decorative ? 'true' : undefined,
        })}
      />
    ),
);
