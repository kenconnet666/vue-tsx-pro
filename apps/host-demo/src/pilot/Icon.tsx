// 试点组件：验证 em 尺寸与图标数据渲染，不进组件库
import type { LucideIconData } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { elementProps, mergeProps, type PartProps } from '@vue-tsx-pro/ui';
import { h, type VNode } from 'vue';

/** 未声明的属性落到 svg 上；绘制相关的属性由组件管理 */
export interface IconProps extends PartProps<'svg', 'viewBox' | 'fill' | 'stroke' | 'role'> {
  /** 图标数据：`import { Check } from '@lucide/icons'` */
  icon: LucideIconData;
  /** 无障碍名称；不写时图标只是装饰，对读屏隐藏 */
  label?: string;
  /** 线条粗细，默认 2 */
  strokeWidth?: number;
}

const styles = stylex.create({
  // 1em：随所在文字等比缩放；略微下沉与文字基线对齐
  icon: { width: '1em', height: '1em', flexShrink: 0, verticalAlign: '-0.125em' },
});

type IconNode = LucideIconData['node'][number];

// 标签名来自数据（path、circle…），类型上只是 string，用 h() 渲染
function renderNode([tag, attrs, children]: IconNode): VNode {
  return h(tag, attrs, children?.map(renderNode));
}

export const Icon = _component(({ icon, label, strokeWidth = 2, sx, ...rest }: IconProps) => {
  return () => (
    <svg
      {...elementProps(
        mergeProps(
          { sx: styles.icon },
          { ...rest, sx },
          {
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': strokeWidth,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            role: label ? 'img' : undefined,
            'aria-label': label,
            'aria-hidden': label ? undefined : 'true',
          },
        ),
      )}
    >
      {icon.node.map(renderNode)}
    </svg>
  );
});
