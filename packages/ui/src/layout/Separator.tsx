/**
 * 分隔线。默认是装饰性的（对读屏隐藏）；分隔的是两组不同的内容、需要读屏感知时设 decorative={false}，
 * 渲染为 role="separator"（竖向时带 aria-orientation）。
 *
 *   <Separator />
 *   <Flex align="center" gap="sm">A<Separator orientation="vertical" />B</Flex>
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { elementProps, mergeProps, type PartProps } from '../utils/props';

/** 角色与朝向由组件管理 */
type Managed = 'role' | 'aria-orientation' | 'aria-hidden';

/** 分隔线方向 */
export interface SeparatorOrientations {
  /** 横线：上下两部分之间，占满容器宽度（默认） */
  horizontal: unknown;
  /** 竖线：左右两部分之间，在 flex 容器里随行高拉伸 */
  vertical: unknown;
}

export interface SeparatorProps extends PartProps<'div', Managed> {
  /** 方向，默认 horizontal */
  orientation?: keyof SeparatorOrientations;
  /** 是否只是视觉装饰，默认 true：对读屏隐藏 */
  decorative?: boolean;
}

const styles = stylex.create({
  root: { flexShrink: 0, backgroundColor: '_borderMuted' },
  horizontal: { height: '_borderWidths.xs', width: '_full' },
  // 在 flex 容器里随行高拉伸
  vertical: { width: '_borderWidths.xs', alignSelf: 'stretch' },
});

export const Separator = _component(
  ({ orientation = 'horizontal', decorative = true, ...rest }: SeparatorProps) =>
    () => (
      <div
        {...elementProps(
          mergeProps<'div'>({ sx: [styles.root, styles[orientation]] }, rest, {
            role: decorative ? 'none' : 'separator',
            'aria-orientation': !decorative && orientation === 'vertical' ? 'vertical' : undefined,
            'aria-hidden': decorative ? 'true' : undefined,
          }),
        )}
      />
    ),
);
