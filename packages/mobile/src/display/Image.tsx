/**
 * 图片：按 fit 填充、加载中与加载失败有占位、可圆角或圆形、可懒加载。
 *
 *   <Image src={url} width={96} height={96} fit="cover" radius="md" />
 *   <Image src={avatar} width={40} height={40} round />
 *
 * 小程序里由运行时渲染成 image 组件，fit 换成对应的 mode。
 */
import { ImageOff } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch } from 'vue';
import { Icon, type IconProps } from '../base/Icon';
import { Loading, type LoadingProps } from '../feedback/Loading';
import { dataAttrs, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';

/** 填充方式（同 CSS 的 object-fit） */
export interface ImageFits {
  /** 保持比例填满，多出的裁掉 */
  cover: unknown;
  /** 保持比例完整显示，可能留白 */
  contain: unknown;
  /** 拉伸填满 */
  fill: unknown;
  /** 原始大小 */
  none: unknown;
}

/** 小程序 image 组件的 mode（运行时读 img 上的 mode 属性） */
const MINI_MODES = {
  cover: 'aspectFill',
  contain: 'aspectFit',
  fill: 'scaleToFill',
  none: 'center',
} as const satisfies Record<keyof ImageFits, string>;

/** 加载状态 */
type ImageStatus = 'loading' | 'loaded' | 'error';

/** 由组件管理的 img 属性 */
export type ImageManaged = 'src' | 'loading' | 'onLoad' | 'onError';

/** 未声明的属性落到 img 上 */
export interface ImageProps extends PartProps<'img', ImageManaged> {
  /** 图片地址 */
  src?: string;
  /** 宽度（px，或 CSS 长度） */
  width?: number | string;
  /** 高度（px，或 CSS 长度） */
  height?: number | string;
  /**
   * 填充方式
   * @default 'fill'
   */
  fit?: keyof ImageFits;
  /** 圆角档位 */
  radius?: 'sm' | 'md' | 'lg';
  /** 圆形 */
  round?: boolean;
  /** 进入视口才加载 */
  lazy?: boolean;
  /**
   * 加载中显示旋转指示
   * @default true
   */
  showLoading?: boolean;
  /**
   * 加载失败显示占位图标
   * @default true
   */
  showError?: boolean;
  /** 加载完成 */
  onLoad?: (event: Event) => void;
  /** 加载失败 */
  onError?: (event: Event) => void;
  /** 外层（裁切与占位）的部件属性 */
  propsRoot?: PartProps<'div'>;
  /** 加载指示的部件属性 */
  propsLoading?: Partial<LoadingProps>;
  /** 失败图标的部件属性 */
  propsError?: Partial<IconProps>;
}

/**
 * 给小程序 image 组件的属性（mode、lazy-load）：浏览器忽略不认识的属性；
 * 不在 img 的属性类型里，单独组一个对象再展开
 */
const miniImageAttrs = (fit: keyof ImageFits, lazy: boolean): Record<string, unknown> => ({
  mode: MINI_MODES[fit],
  'lazy-load': lazy || undefined,
});

const length = (value: number | string | undefined) =>
  typeof value === 'number' ? `${value}px` : value;

/** Image 的样式：root、round、各圆角、img、hidden、placeholder */
export const imageStyles = css.create({
  root: {
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    verticalAlign: 'middle',
    backgroundColor: {
      default: 'transparent',
      '[data-status="loading"]': '_fill',
      '[data-status="error"]': '_fill',
    },
  },
  round: { borderRadius: '_full' },
  sm: { borderRadius: '_sm' },
  md: { borderRadius: '_md' },
  lg: { borderRadius: '_lg' },
  img: { display: 'block', width: '100%', height: '100%' },
  hidden: { opacity: 0 },
  placeholder: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '_xxl',
    color: '_textPlaceholder',
  },
});

/** 图片（div > img + 占位） */
export const Image = _component(
  ({
    src,
    width,
    height,
    fit = 'fill',
    radius,
    round = false,
    lazy = false,
    showLoading = true,
    showError = true,
    onLoad,
    onError,
    propsRoot,
    propsLoading,
    propsError,
    ...rest
  }: ImageProps) => {
    let status = _state<ImageStatus>(src ? 'loading' : 'error');
    watch(
      () => src,
      (next) => (status = next ? 'loading' : 'error'),
    );
    return () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [imageStyles.root, round && imageStyles.round, radius && imageStyles[radius]] },
          propsRoot,
          {
            style: { width: length(width), height: length(height) },
            ...dataAttrs({ 'data-status': status }),
          },
        )}
      >
        {src && (
          <img
            {...mergeAttrs<'img'>(
              { sx: [imageStyles.img, status !== 'loaded' && imageStyles.hidden] },
              rest,
              {
                src,
                loading: lazy ? 'lazy' : undefined,
                style: { objectFit: fit },
                ...miniImageAttrs(fit, lazy),
                onLoad: (event: Event) => {
                  status = 'loaded';
                  onLoad?.(event);
                },
                onError: (event: Event) => {
                  status = 'error';
                  onError?.(event);
                },
              },
            )}
          />
        )}
        {status === 'loading' && showLoading && (
          <div {...mergeAttrs<'div'>({ sx: imageStyles.placeholder })}>
            <Loading {...mergePartProps<LoadingProps>({}, propsLoading)} />
          </div>
        )}
        {status === 'error' && showError && (
          <div {...mergeAttrs<'div'>({ sx: imageStyles.placeholder })}>
            <Icon {...mergePartProps<IconProps>({ icon: ImageOff }, propsError)} />
          </div>
        )}
      </div>
    );
  },
);
