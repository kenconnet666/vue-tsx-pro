/**
 * 加载指示：旋转的圆弧，可带文字。大小随所在文字（1em），颜色随文字；表示"一个操作正在进行"。
 *
 *   <Loading />                         装饰性：旁边已经有说明
 *   <Loading>加载中…</Loading>          带文字：role="status"，读屏会念出
 *   <Loading vertical size={24}>…</Loading>
 */
import { LoaderCircle } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';

/** 未声明的属性落到外层的 span 上 */
export interface LoadingProps extends PartProps<'span', 'role'> {
  /** 图标大小（px）；不写时为 1em */
  size?: number;
  /** 文字放在图标下面（整块的加载状态） */
  vertical?: boolean;
  /** 说明文字；有文字时 role="status" */
  children?: VNodeChild;
  /** 旋转图标的部件属性 */
  propsIcon?: Partial<IconProps>;
  /** 文字的部件属性 */
  propsText?: PartProps<'span'>;
}

const spin = css.keyframes({ to: { transform: 'rotate(360deg)' } });

/** Loading 的样式：root、vertical、icon、text */
export const loadingStyles = css.create({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_sm',
    // 颜色跟随所在文字：按钮里是按钮的字色，页面里由使用方的 sx 定
    verticalAlign: 'middle',
  },
  vertical: { flexDirection: 'column', gap: '_sm' },
  icon: {
    animationName: spin,
    // 旋转本身就是"还在加载"的信息，减少动态效果时转慢一些而不停
    animationDuration: { default: '0.8s', _reducedMotion: '1.6s' },
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
  text: { fontSize: '_sm' },
});

/** 加载指示（span > 图标 + 文字） */
export const Loading = _component(
  ({ size, vertical = false, children, propsIcon, propsText, ...rest }: LoadingProps) =>
    () => {
      const labelled = hasContent(children);
      return (
        <span
          {...mergeAttrs<'span'>(
            { sx: [loadingStyles.root, vertical && loadingStyles.vertical] },
            rest,
            { role: labelled ? 'status' : undefined },
          )}
        >
          <Icon
            {...mergePartProps<IconProps>(
              { icon: LoaderCircle, size, sx: loadingStyles.icon },
              propsIcon,
            )}
          />
          {labelled && (
            <span {...mergeAttrs<'span'>({ sx: loadingStyles.text }, propsText)}>{children}</span>
          )}
        </span>
      );
    },
);
