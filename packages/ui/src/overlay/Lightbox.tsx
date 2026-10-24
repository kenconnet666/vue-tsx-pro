/**
 * 图片预览（全屏的模态 dialog）：深色背景上看大图——缩放、拖动、旋转、还原、下载，几张图时左右切换。
 * Image 的 preview 打开它（同一个 ImageGroup 里的图共用一个），也可以单独用。参考 Ant Design Image 的预览、Element Plus 的 image-viewer。
 *
 *   <Lightbox open={_bind(viewing)} index={_bind(at)} items={[{ src: '/photos/1.jpg', alt: '支架正面' }, …]} />
 *
 * - 平移与缩放建在 usePanZoom 上：拖动平移，滚轮、触控板、捏合以指针为中心缩放，双击放大 / 还原；
 *   打开或换一张时整张图放进视口（不超过原大）。旋转以 90° 为一档，转完重新放进视口。
 * - 键盘：← / → 上一张、下一张，+ / − 缩放，0 还原，R 向右旋转，Esc 关闭；焦点在工具栏与图片区之间循环（模态）。
 * - 读屏：dialog 的名称是“图片预览”，图片区是 role="img"、名称是图片的 alt；换一张时念出“第 2 张，共 5 张”。
 *
 * 部件：Root（dialog）、Toolbar（div）、Counter（span）、Viewport（div）、Image（img）、Previous、Next（IconButton）、Caption（div）。
 */
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  RotateCw,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { nextTick, onBeforeUnmount, type VNodeChild } from 'vue';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { IconLinkButton, type IconLinkButtonProps } from '../base/IconLinkButton';
import { useLang } from '../config/context';
import { clamp } from '../utils/data/number';
import { openSetter, type OpenChangeProps, type OpenChangeReasons } from '../utils/dom/open-change';
import { openModalDialog } from '../utils/dom/overlay';
import { usePanZoom } from '../utils/dom/pan-zoom';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { transitions } from '../utils/style/transitions';

/** 一张图 */
export interface LightboxItem {
  /** 大图的地址 */
  src: string;
  /** 图片的说明（读屏念它） */
  alt: string;
  /** 图片下方的说明文字 */
  caption?: VNodeChild;
  /** 下载时的文件名；false 不显示下载按钮 */
  download?: string | false;
}

/** 打开、关联由组件管理；未声明的属性落到 dialog 上 */
export interface LightboxProps
  extends PartProps<'dialog', 'open' | 'aria-label' | 'aria-labelledby'>, OpenChangeProps {
  /** 是否打开：父级写 open={_bind(x)}；Esc、关闭按钮会关上并写回 */
  open?: boolean;
  /** 图片 */
  items: readonly LightboxItem[];
  /** 当前第几张，从 0 开始：父级可以写 index={_bind(x)} */
  index?: number;
  /** 到头之后从另一头继续，默认 false */
  loop?: boolean;
  /** 工具栏按钮的部件属性 */
  propsButton?: Partial<IconButtonProps>;
  /** 图片区（视口）的部件属性 */
  propsViewport?: PartProps<'div'>;
  /** 说明文字的部件属性 */
  propsCaption?: PartProps<'div'>;
}

/** Lightbox 的样式：root、toolbar、counter、viewport、content、image、side、previous、next、caption、button */
export const lightboxStyles = stylex.create({
  root: {
    // 占满视口：原生 dialog 默认有最大宽高与边框
    boxSizing: 'border-box',
    width: '100vw',
    height: '100dvh',
    maxWidth: 'none',
    maxHeight: 'none',
    margin: 0,
    padding: 0,
    borderWidth: 0,
    display: { default: 'none', ':modal': 'flex' },
    flexDirection: 'column',
    // 图片预览总是深色背景：不跟主题变（看图片本身的颜色）
    backgroundColor: 'rgb(0 0 0 / 0.86)',
    color: 'white',
    colorScheme: 'dark',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '_xs',
    paddingBlock: '_sm',
    paddingInline: '_md',
    flexShrink: 0,
  },
  counter: {
    marginInlineEnd: 'auto',
    fontVariantNumeric: 'tabular-nums',
    fontSize: '_sm',
    opacity: 0.8,
  },
  zoom: {
    minWidth: '3.5em',
    textAlign: 'center',
    fontSize: '_sm',
    fontVariantNumeric: 'tabular-nums',
  },
  viewport: {
    position: 'relative',
    flexGrow: 1,
    minHeight: 0,
    overflow: 'hidden',
    cursor: { default: 'grab', ':active': 'grabbing' },
    outline: 'none',
  },
  // 平移与缩放作用在它上面（transform-origin 左上角）；它的大小是旋转之后图片占的框
  content: { position: 'absolute', top: 0, left: 0, transformOrigin: '0 0' },
  // 图片以框的中心旋转
  image: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    maxWidth: 'none',
    userSelect: 'none',
    pointerEvents: 'none',
  },
  smooth: { transitionProperty: 'transform', transitionDuration: '_md' },
  side: {
    position: 'absolute',
    top: '50%',
    translate: '0 -50%',
    zIndex: 1,
  },
  previous: { insetInlineStart: '_md' },
  next: { insetInlineEnd: '_md' },
  caption: {
    flexShrink: 0,
    paddingBlock: '_md',
    paddingInline: '_xl',
    textAlign: 'center',
    fontSize: '_sm',
    opacity: 0.9,
  },
  // 深色背景上的按钮：文字白色，悬停时浅一点的底
  button: {
    color: 'white',
    backgroundColor: { default: 'transparent', ':hover': 'rgb(255 255 255 / 0.12)' },
  },
});

/** Lightbox 的动态样式：平移缩放、框的大小、图片的大小与旋转 */
export const lightboxDynamicStyles = stylex.create({
  transform: (transform: string) => ({ transform }),
  box: (width: number, height: number) => ({ width: `${width}px`, height: `${height}px` }),
  image: (width: number, height: number, degrees: number) => ({
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(-50%, -50%) rotate(${degrees}deg)`,
  }),
});

/** 图片预览：全屏 dialog，缩放、拖动、旋转、左右切换 */
export const Lightbox = _component(
  ({
    open = _bindable(false),
    onOpenChange,
    items,
    index = _bindable(0),
    loop = false,
    propsButton,
    propsViewport,
    propsCaption,
    ...rest
  }: LightboxProps) => {
    const lang = useLang();
    let dialog = _state.raw<HTMLDialogElement | null>(null);
    let viewport = _state.raw<HTMLElement | null>(null);
    // 当前图片的原始大小（加载后知道）与旋转（0、90、180、270）
    let natural = _state<{ width: number; height: number } | null>(null);
    let rotation = _state(0);
    let release: (() => void) | undefined;
    let closing: keyof OpenChangeReasons | undefined;
    const setOpen = openSetter(
      () => open,
      (next) => (open = next),
      () => onOpenChange,
    );

    const current = () => items[clamp(index, 0, Math.max(0, items.length - 1))];
    /** 旋转之后图片占的框 */
    const box = () => {
      if (!natural) return { width: 0, height: 0 };
      const sideways = rotation % 180 !== 0;
      return sideways
        ? { width: natural.height, height: natural.width }
        : { width: natural.width, height: natural.height };
    };

    const view = usePanZoom({
      viewport: () => viewport,
      min: 0.05,
      max: 8,
      bounds: () => (natural ? box() : undefined),
      initial: () => ({ x: 0, y: 0, scale: 1 }),
    });

    /** 整张图放进视口（不超过原大）：打开、换一张、旋转之后 */
    function fitImage() {
      if (!natural) return;
      const { width, height } = box();
      view.fit(width, height, 24);
    }

    function go(step: 1 | -1) {
      if (items.length < 2) return;
      const next = index + step;
      if (next < 0 || next >= items.length) {
        if (!loop) return;
        index = (next + items.length) % items.length;
      } else index = next;
    }

    function rotate(step: 1 | -1) {
      rotation = (rotation + step * 90 + 360) % 360;
      void nextTick(fitImage);
    }

    function reset() {
      rotation = 0;
      void nextTick(fitImage);
    }

    function onLoad(event: Event) {
      const image = event.currentTarget as HTMLImageElement;
      natural = { width: image.naturalWidth, height: image.naturalHeight };
      void nextTick(fitImage);
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        // 从右到左排版时左右对调
        const rtl = dialog ? getComputedStyle(dialog).direction === 'rtl' : false;
        go((event.key === 'ArrowRight') !== rtl ? 1 : -1);
        event.preventDefault();
      } else if (event.key === 'r' || event.key === 'R') {
        rotate(1);
        event.preventDefault();
      }
    }

    function close() {
      closing = 'close';
      dialog?.close();
    }

    // 不论怎么关上（Esc、关闭按钮、open 改成 false），原生 close 事件都会来
    function onClose() {
      release?.();
      release = undefined;
      const reason = closing ?? 'escape';
      closing = undefined;
      setOpen(false, reason);
    }

    // 换一张：原图大小重新量，方向回正
    _effect(() => {
      void current()?.src;
      natural = null;
      rotation = 0;
    });
    _effect(() => {
      if (open && dialog && !dialog.open) {
        release = openModalDialog(dialog);
        void nextTick(() => viewport?.focus());
      } else if (!open && dialog?.open) dialog.close();
    });
    // 预先加载前后两张：切换时不闪
    _effect(() => {
      if (!open) return;
      for (const step of [-1, 1]) {
        const neighbour = items[index + step];
        if (neighbour) new Image().src = neighbour.src;
      }
    });
    onBeforeUnmount(() => release?.());

    const button = (props: Partial<IconButtonProps>) =>
      mergePartProps<IconButtonProps>(
        {
          icon: X,
          variant: 'ghost',
          tone: 'neutral',
          sx: lightboxStyles.button,
          'aria-label': '',
        },
        propsButton,
        props,
      );

    return () => {
      const item = current();
      const total = items.length;
      const { width, height } = box();
      const canDownload = item && item.download !== false;
      return (
        <dialog
          {...mergeAttrs<'dialog'>({ sx: [lightboxStyles.root, transitions.backdrop] }, rest, {
            ref: _toRef(dialog),
            'aria-label': lang.lightboxLabel,
            onClose,
            onKeydown,
          })}
        >
          <div {...stylex.attrs(lightboxStyles.toolbar)}>
            <span {...stylex.attrs(lightboxStyles.counter)} aria-live="polite">
              {total > 1 ? lang.lightboxCounter(index + 1, total) : ''}
            </span>
            <IconButton
              {...button({
                icon: ZoomOut,
                'aria-label': lang.lightboxZoomOut,
                onClick: () => view.zoomOut(),
              })}
            />
            <span {...stylex.attrs(lightboxStyles.zoom)} aria-hidden="true">
              {Math.round(view.scale * 100)}%
            </span>
            <IconButton
              {...button({
                icon: ZoomIn,
                'aria-label': lang.lightboxZoomIn,
                onClick: () => view.zoomIn(),
              })}
            />
            <IconButton
              {...button({
                icon: RotateCcw,
                'aria-label': lang.lightboxRotateLeft,
                onClick: () => rotate(-1),
              })}
            />
            <IconButton
              {...button({
                icon: RotateCw,
                'aria-label': lang.lightboxRotateRight,
                onClick: () => rotate(1),
              })}
            />
            <IconButton
              {...button({ icon: Undo2, 'aria-label': lang.lightboxReset, onClick: reset })}
            />
            {canDownload && (
              <IconLinkButton
                {...mergePartProps<IconLinkButtonProps>(
                  {
                    icon: Download,
                    variant: 'ghost',
                    tone: 'neutral',
                    sx: lightboxStyles.button,
                    'aria-label': lang.lightboxDownload,
                    href: item.src,
                  },
                  // 下载而不是打开：download 是文件名，空字符串时用地址里的名字
                  { download: item.download ?? '' } as Partial<IconLinkButtonProps>,
                )}
              />
            )}
            <IconButton
              {...button({
                icon: X,
                'aria-label': lang.close,
                onClick: close,
              })}
            />
          </div>
          <div
            {...mergeAttrs<'div'>({ sx: lightboxStyles.viewport }, propsViewport, {
              ...view.viewportProps,
              ref: _toRef(viewport),
              tabindex: 0,
              role: 'img',
              'aria-label': item?.alt,
            })}
          >
            {item && (
              <div
                {...stylex.attrs(
                  lightboxStyles.content,
                  !view.interacting && lightboxStyles.smooth,
                  lightboxDynamicStyles.transform(view.transform),
                  lightboxDynamicStyles.box(width, height),
                )}
              >
                <img
                  key={item.src}
                  src={item.src}
                  alt=""
                  draggable={false}
                  onLoad={onLoad}
                  {...stylex.attrs(
                    lightboxStyles.image,
                    natural && lightboxDynamicStyles.image(natural.width, natural.height, rotation),
                  )}
                />
              </div>
            )}
          </div>
          {total > 1 && (loop || index > 0) && (
            <IconButton
              {...button({
                icon: ChevronLeft,
                propsIcon: { flipInRtl: true },
                radius: 'full',
                sx: [lightboxStyles.button, lightboxStyles.side, lightboxStyles.previous],
                'aria-label': lang.lightboxPrevious,
                onClick: () => go(-1),
              })}
            />
          )}
          {total > 1 && (loop || index < total - 1) && (
            <IconButton
              {...button({
                icon: ChevronRight,
                propsIcon: { flipInRtl: true },
                radius: 'full',
                sx: [lightboxStyles.button, lightboxStyles.side, lightboxStyles.next],
                'aria-label': lang.lightboxNext,
                onClick: () => go(1),
              })}
            />
          )}
          {item?.caption != null && (
            <div {...mergeAttrs<'div'>({ sx: lightboxStyles.caption }, propsCaption)}>
              {item.caption}
            </div>
          )}
        </dialog>
      );
    };
  },
);
