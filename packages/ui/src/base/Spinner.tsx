/**
 * 加载中的旋转指示：Lucide 的 LoaderCircle 图标加旋转，默认跟随所在文字的大小与颜色。
 * 表示“一个操作正在进行”（按钮家族、Alert、LoadingOverlay、Switch、Tree 展开）；内容还没来时的占位用 Skeleton。
 *
 *   <Spinner />                       装饰性：旁边已经有“加载中”之类的文字
 *   <Spinner label="正在加载订单" />   单独出现：role="status"，读屏会念出 label
 */
import { LoaderCircle } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import type { TextSize } from '../utils/style/typography';
import { Icon, type IconProps } from './Icon';
import { VisuallyHidden } from './VisuallyHidden';

/** 未声明的属性落到外层的 span 上 */
export interface SpinnerProps extends PartProps<'span', 'role'> {
  /** 读屏念的说明；给了就是 role="status"，不给就是装饰性的（对读屏隐藏） */
  label?: string;
  /** 字号档位，不写时为 1em，跟随所在文字 */
  size?: TextSize;
  /** 图标（旋转的那个 svg）的部件属性 */
  propsIcon?: Partial<IconProps>;
}

const spin = css.keyframes({ to: { transform: 'rotate(360deg)' } });

/** Spinner 的样式：root、icon */
export const spinnerStyles = css.create({
  root: { display: 'inline-flex', flexShrink: 0 },
  icon: {
    animationName: spin,
    // 旋转本身就是“还在加载”的信息，不随 durations 变为 0；减少动态效果时转慢一些
    animationDuration: { default: '0.8s', _reducedMotion: '1.6s' },
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
});

/** 加载指示（span > 图标）：有 label 时是 role="status" */
export const Spinner = _component(({ label, size, propsIcon, ...rest }: SpinnerProps) => () => (
  <span
    {...mergeAttrs<'span'>({ sx: spinnerStyles.root }, rest, {
      role: label ? 'status' : undefined,
    })}
  >
    <Icon
      {...mergePartProps<IconProps>(
        { icon: LoaderCircle, size, sx: spinnerStyles.icon },
        propsIcon,
      )}
    />
    {label && <VisuallyHidden>{label}</VisuallyHidden>}
  </span>
));
