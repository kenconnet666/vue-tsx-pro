/**
 * 图片：懒加载，加载时是扫光的占位，加载失败显示占位与原因；写了 preview 时点击（或 Enter）看大图（Lightbox）。
 * 同一个 ImageGroup 里的图片共用一个 Lightbox，大图里可以左右切换（相册、工单附件、验收照片）。
 *
 *   <Image src="/photos/1-thumb.jpg" alt="支架正面" width={160} height={120} preview={{ src: '/photos/1.jpg' }} />
 *   <ImageGroup>
 *     {photos.map((photo) => <Image src={photo.thumb} alt={photo.title} preview={{ src: photo.url }} />)}
 *   </ImageGroup>
 *
 * 可以预览的图片是按钮：名称“查看大图：alt”，键盘能到。尺寸写 width、height（数字是 px），object-fit 用 fit。
 * 部件：Root（span，可以预览时是 button）、Image（img）、Fallback（span）。
 */
import { ImageOff } from '@lucide/icons';
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { watch, type VNodeChild } from 'vue';
import { Icon } from '../base/Icon';
import { useLang } from '../config/context';
import { Lightbox, type LightboxItem, type LightboxProps } from '../overlay/Lightbox';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { shimmerStyles } from '../utils/style/shimmer';
import { focusRingStyles, radiusStyles, type Radius } from '../utils/style/styles';

/** object-fit 的取值 */
export interface ImageFits {
  /** 铺满、裁掉多余（默认）：缩略图、头像 */
  cover: unknown;
  /** 整张放进去、留白：商品图、图纸 */
  contain: unknown;
  /** 拉伸铺满 */
  fill: unknown;
  /** 原大，超出的裁掉 */
  none: unknown;
  /** 比框大时同 contain，否则原大 */
  'scale-down': unknown;
}

/** 预览的选项 */
export interface ImagePreviewOptions {
  /** 大图的地址；不写时用 src */
  src?: string;
  /** 大图下方的说明 */
  caption?: VNodeChild;
  /** 下载的文件名；false 不显示下载按钮 */
  download?: string | false;
}

/** 未声明的属性落到 img 上；外层用 propsRoot */
export interface ImageProps extends PartProps<'img', 'src' | 'alt' | 'width' | 'height'> {
  /** 图片地址 */
  src: string;
  /** 图片的说明：读屏念它，加载失败时也显示 */
  alt: string;
  /** 宽度：数字是 px，也可以写 CSS 长度；不写时按图片 */
  width?: number | string;
  /** 高度：数字是 px，也可以写 CSS 长度 */
  height?: number | string;
  /** 图片在框里怎么放，默认 cover */
  fit?: keyof ImageFits;
  /** 圆角档位，默认 md */
  radius?: Radius;
  /** 点击看大图：true 或预览的选项（大图地址、说明、下载） */
  preview?: boolean | ImagePreviewOptions;
  /** 加载失败时显示的内容；默认是图标与 alt */
  fallback?: VNodeChild;
  /** 外层（span，可以预览时是 button）的部件属性 */
  propsRoot?: PartProps<'span'>;
  /** 加载失败的占位的部件属性 */
  propsFallback?: PartProps<'span'>;
}

/** Image 的样式：root、button、image、hidden、fallback */
export const imageStyles = css.create({
  root: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    verticalAlign: 'middle',
    backgroundColor: '_fill',
    color: '_textMuted',
  },
  // 可以预览：去掉按钮外观，指针变成放大镜
  button: {
    padding: 0,
    borderWidth: 0,
    font: 'inherit',
    cursor: 'zoom-in',
  },
  image: { display: 'block', width: '100%', height: '100%' },
  // 加载完之前不显示（占位在扫光）；没写尺寸时仍占位，量得出图片大小
  hidden: { opacity: 0 },
  fallback: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_xs',
    padding: '_sm',
    fontSize: '_xs',
    textAlign: 'center',
  },
});

/** Image 的 object-fit：cover、contain、fill、none、scale-down */
export const imageFitStyles = css.create({
  cover: { objectFit: 'cover' },
  contain: { objectFit: 'contain' },
  fill: { objectFit: 'fill' },
  none: { objectFit: 'none' },
  'scale-down': { objectFit: 'scale-down' },
});

/** Image 的动态样式：尺寸 */
export const imageDynamicStyles = css.create({
  size: (width: string, height: string) => ({ width, height }),
});

/** ImageGroup 交给里面的 Image 的：登记自己、打开预览 */
interface ImageGroupState {
  /** 登记一张可以预览的图，返回读它当前序号的函数与注销函数 */
  register(item: () => LightboxItem): { index: () => number; release: () => void };
  /** 从第 index 张打开预览 */
  open(index: number): void;
}

const ImageGroupContext = createContext<ImageGroupState>('ImageGroup');

const toLength = (value: number | string | undefined) =>
  value == null ? 'auto' : typeof value === 'number' ? `${value}px` : value;

/** 图片：懒加载、加载中占位、失败占位，可以点开看大图 */
export const Image = _component(
  ({
    src,
    alt,
    width,
    height,
    fit = 'cover',
    radius = 'md',
    preview = false,
    fallback,
    propsRoot,
    propsFallback,
    ...rest
  }: ImageProps) => {
    const lang = useLang();
    const group = ImageGroupContext.inject(null);
    let status = _state<'loading' | 'loaded' | 'error'>('loading');
    let viewing = _state(false);
    const options = () => (typeof preview === 'object' ? preview : {});
    const item = (): LightboxItem => ({
      src: options().src ?? src,
      alt,
      caption: options().caption,
      download: options().download,
    });
    // 在 ImageGroup 里：登记自己，预览交给组
    const membership = _untrack(preview) && group ? group.register(item) : undefined;
    if (membership) _effect(() => membership.release);

    // 地址换了：重新加载（只在变化时；挂载后再置回 loading 会盖掉已经到了的 load，缓存里的图就一直不显示）
    watch(
      () => src,
      () => (status = 'loading'),
    );

    function open() {
      if (membership) group!.open(membership.index());
      else viewing = true;
    }

    return () => {
      const sx = [
        imageStyles.root,
        radiusStyles[radius],
        imageDynamicStyles.size(toLength(width), toLength(height)),
        status === 'loading' && shimmerStyles.wave,
      ];
      const content = (
        <>
          {status !== 'error' && (
            <img
              {...mergeAttrs<'img'>(
                {
                  sx: [
                    imageStyles.image,
                    imageFitStyles[fit],
                    status === 'loading' && imageStyles.hidden,
                    status === 'loaded' && shimmerStyles.reveal,
                  ],
                  loading: 'lazy',
                  decoding: 'async',
                },
                rest,
                {
                  src,
                  alt,
                  onLoad: () => (status = 'loaded'),
                  onError: () => (status = 'error'),
                },
              )}
            />
          )}
          {status === 'error' && (
            <span
              {...mergeAttrs<'span'>({ sx: imageStyles.fallback }, propsFallback, {
                role: 'img',
                'aria-label': alt,
              })}
              aria-description={lang.imageError}
            >
              {fallback ?? (
                <>
                  <Icon icon={ImageOff} />
                  <span aria-hidden="true">{alt}</span>
                </>
              )}
            </span>
          )}
        </>
      );
      if (!preview || status === 'error')
        return <span {...mergeAttrs<'span'>({ sx }, propsRoot)}>{content}</span>;
      return (
        <>
          <button
            {...mergeAttrs<'button'>(
              { sx: [...sx, imageStyles.button, focusRingStyles.visible] },
              propsRoot as PartProps<'button'>,
              { type: 'button', 'aria-label': lang.imagePreview(alt), onClick: open },
            )}
          >
            {content}
          </button>
          {!membership && <Lightbox items={[item()]} open={_bind(viewing)} />}
        </>
      );
    };
  },
);

/** 未声明的属性落到外层 div 上 */
export interface ImageGroupProps extends PartProps<'div'> {
  /** 到头之后从另一头继续，默认 false */
  loop?: boolean;
  /** 预览（Lightbox）的部件属性 */
  propsLightbox?: Partial<LightboxProps>;
  /** 里面的 Image（也可以夹着别的内容） */
  children?: VNodeChild;
}

/** ImageGroup 的样式：root */
export const imageGroupStyles = css.create({
  root: { display: 'flex', flexWrap: 'wrap', gap: '_sm' },
});

/** 一组图片：共用一个预览，大图里左右切换 */
export const ImageGroup = _component(
  ({ loop = false, propsLightbox, children, ...rest }: ImageGroupProps) => {
    // 登记的图片：按登记（渲染）的顺序。不是响应式的：组的渲染不能读它们的属性——
    // 渲染里生成的子节点会给它们新的属性，读了就又触发组的渲染，无限循环
    let entries: { read: () => LightboxItem }[] = [];
    // 打开预览时取的一份
    let items = _state.raw<LightboxItem[]>([]);
    let open = _state(false);
    let index = _state(0);

    ImageGroupContext.provide({
      register(read) {
        const entry = { read };
        entries = [...entries, entry];
        return {
          index: () => entries.indexOf(entry),
          release: () => (entries = entries.filter((item) => item !== entry)),
        };
      },
      open(at) {
        items = entries.map((entry) => entry.read());
        index = at;
        open = true;
      },
    });

    return () => (
      <div {...mergeAttrs<'div'>({ sx: imageGroupStyles.root }, rest)}>
        {children}
        <Lightbox
          {...mergePartProps<Partial<LightboxProps>>({ loop }, propsLightbox)}
          items={items}
          open={_bind(open)}
          index={_bind(index)}
        />
      </div>
    );
  },
);
