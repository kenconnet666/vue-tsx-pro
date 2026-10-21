/**
 * 分隔线。默认是装饰性的（对读屏隐藏）；分隔的是两组不同的内容、需要读屏感知时设 decorative={false}，
 * 渲染为 role="separator"（竖向时带 aria-orientation）。
 *
 *   <Separator />
 *   <Flex align="center" gap="sm">A<Separator orientation="vertical" />B</Flex>
 *   <Separator>或者</Separator>                       横线中间带文字
 *   <Separator labelAlign="start">更改后</Separator>  文字靠起始边，线在后面
 *
 * 带文字（只用于横线）时：文字照常给读屏，两段线对读屏隐藏；decorative={false} 时整条是 role="separator"、以文字为名称。
 *
 * 部件：Root（div）；带文字时还有 Label（span）与 Line（两段线，span）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
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

/** 文字在横线上的位置 */
export interface SeparatorLabelAligns {
  /** 起始边：文字在前、线在后，像一节的小标题 */
  start: unknown;
  /** 居中（默认）：两边各一段线，如“或者” */
  center: unknown;
  /** 结束边 */
  end: unknown;
}

/** 未声明的属性落到 div 上 */
export interface SeparatorProps extends PartProps<'div', SeparatorManaged> {
  /** 方向，默认 horizontal */
  orientation?: keyof SeparatorOrientations;
  /** 是否只是视觉装饰，默认 true：对读屏隐藏（带文字时文字仍给读屏） */
  decorative?: boolean;
  /** 带文字时文字的位置，默认 center */
  labelAlign?: keyof SeparatorLabelAligns;
  /** 文字的部件属性 */
  propsLabel?: PartProps<'span'>;
  /** 两段线的部件属性 */
  propsLine?: PartProps<'span', 'aria-hidden'>;
  /** 线上的文字（只用于横线） */
  children?: VNodeChild;
}

/** Separator 的样式：root、horizontal、vertical、labelled、label、line */
export const separatorStyles = stylex.create({
  root: { flexShrink: 0, backgroundColor: '_borderMuted' },
  horizontal: { height: '_borderWidths.xs', width: '_full' },
  // 在 flex 容器里随行高拉伸
  vertical: { width: '_borderWidths.xs', alignSelf: 'stretch' },
  // 带文字：外层不画线，两段线各自伸展
  labelled: {
    display: 'flex',
    alignItems: 'center',
    gap: '_md',
    width: '_full',
    color: '_textMuted',
    fontSize: '_sm',
    lineHeight: '_tight',
  },
  label: { flexShrink: 0, whiteSpace: 'nowrap' },
  line: { flexGrow: 1, height: '_borderWidths.xs', backgroundColor: '_borderMuted' },
});

/** 分隔线（div）：默认装饰性、对读屏隐藏；decorative={false} 时为 role="separator"；可以带文字 */
export const Separator = _component(
  ({
    orientation = 'horizontal',
    decorative = true,
    labelAlign = 'center',
    propsLabel,
    propsLine,
    children,
    ...rest
  }: SeparatorProps) => {
    const labelId = useId();
    return () => {
      if (children == null || orientation === 'vertical') {
        return (
          <div
            {...mergeAttrs<'div'>(
              { sx: [separatorStyles.root, separatorStyles[orientation]] },
              rest,
              {
                role: decorative ? 'none' : 'separator',
                'aria-orientation':
                  !decorative && orientation === 'vertical' ? 'vertical' : undefined,
                'aria-hidden': decorative ? 'true' : undefined,
              },
            )}
          />
        );
      }
      const line = () => (
        <span
          {...mergeAttrs<'span'>({ sx: separatorStyles.line }, propsLine, { 'aria-hidden': true })}
        />
      );
      return (
        <div
          {...mergeAttrs<'div'>({ sx: separatorStyles.labelled }, rest, {
            role: decorative ? 'none' : 'separator',
            'aria-labelledby': decorative ? undefined : labelId,
          })}
          data-label-align={labelAlign}
        >
          {labelAlign !== 'start' && line()}
          <span {...mergeAttrs<'span'>({ sx: separatorStyles.label }, propsLabel, { id: labelId })}>
            {children}
          </span>
          {labelAlign !== 'end' && line()}
        </div>
      );
    };
  },
);
