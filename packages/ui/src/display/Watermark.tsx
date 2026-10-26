/**
 * 水印：在内容上（或整页）铺满斜着的文字或图片，截图、拍屏时能看出来源（查看人、时间、密级）。
 *
 *   <Watermark content={['林小满', '2026-10-24']}>{report}</Watermark>
 *   <Watermark content="内部资料" fullscreen />                       整页
 *   <Watermark image="/logo.svg" width={120} height={40}>…</Watermark>
 *
 * 用 canvas 画一格（按设备像素比放大，高分屏不糊），作为一层盖在内容上的背景平铺：pointer-events: none，
 * 不挡点击与选择；aria-hidden，读屏不念。默认颜色是半透明的灰，亮色、暗色主题上都看得见、不抢内容。
 * 只是提示性的：前端的水印删得掉，真正的保密要靠服务端（导出时打水印、权限）。
 * 部件：Root（div：包着内容，position: relative）、Layer（div：水印那一层）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { onMounted, watch, type VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到外层 div 上 */
export interface WatermarkProps extends PartProps<'div'> {
  /** 文字：一行写字符串，多行写数组（姓名、日期） */
  content?: string | readonly string[];
  /** 图片地址：给了就画图片（同源或允许跨域的图片），不画文字 */
  image?: string;
  /** 图片的宽（px），默认 120 */
  width?: number;
  /** 图片的高（px），默认 40 */
  height?: number;
  /** 旋转角度（度），默认 -22 */
  rotate?: number;
  /** 每格之间的空隙 [横, 竖]（px），默认 [120, 100] */
  gap?: readonly [number, number];
  /** 字号（px），默认 14 */
  fontSize?: number;
  /** 颜色，默认半透明的灰 */
  color?: string;
  /** 盖住整页（position: fixed），而不只是包着的内容 */
  fullscreen?: boolean;
  /** 水印那一层的部件属性 */
  propsLayer?: PartProps<'div'>;
  children?: VNodeChild;
}

/** Watermark 的样式：root、layer、fullscreen */
export const watermarkStyles = css.create({
  root: { position: 'relative' },
  layer: {
    position: 'absolute',
    inset: 0,
    zIndex: 9,
    pointerEvents: 'none',
    backgroundRepeat: 'repeat',
    // Windows 高对比下系统会去掉背景图：水印本来就是装饰，不需要
    forcedColorAdjust: 'auto',
  },
  fullscreen: { position: 'fixed', zIndex: 1000 },
});

/** 水印那一层的背景（data URL 与一格的大小） */
export const watermarkTileStyles = css.create({
  tile: (url: string, size: string) => ({ backgroundImage: url, backgroundSize: size }),
});

const DEFAULT_COLOR = 'rgba(128, 128, 128, 0.16)';

/** 水印：一层不挡操作的平铺文字或图片 */
export const Watermark = _component(
  ({
    content,
    image,
    width = 120,
    height = 40,
    rotate = -22,
    gap = [120, 100],
    fontSize = 14,
    color = DEFAULT_COLOR,
    fullscreen = false,
    propsLayer,
    children,
    ...rest
  }: WatermarkProps) => {
    // 一格的图（data URL）与它在页面上的大小（CSS px）
    let tile = _state<{ url: string; width: number; height: number } | null>(null);

    let drawing = 0;

    /**
     * 画一块平铺单元：两行两列的格子里斜对角各画一份（同 antd），平铺后相邻两行错开半格，铺得匀；
     * 每份居中、旋转，四周留出 gap 的一半
     */
    async function draw() {
      if (typeof document === 'undefined') return;
      const current = ++drawing;
      const ratio = window.devicePixelRatio || 1;
      const lines = typeof content === 'string' ? [content] : [...(content ?? [])];
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;
      const font = `${fontSize}px sans-serif`;
      context.font = font;
      const lineHeight = fontSize * 1.4;
      const [contentWidth, contentHeight] = image
        ? [width, height]
        : [
            Math.max(1, ...lines.map((line) => context.measureText(line).width)),
            lines.length * lineHeight,
          ];
      const cellWidth = contentWidth + gap[0];
      const cellHeight = contentHeight + gap[1];
      let picture: HTMLImageElement | undefined;
      if (image) {
        picture = new Image();
        picture.crossOrigin = 'anonymous';
        picture.src = image;
        await picture.decode().catch(() => undefined);
        // 等图片时参数又变了：交给后一次
        if (current !== drawing) return;
      }
      canvas.width = cellWidth * 2 * ratio;
      canvas.height = cellHeight * 2 * ratio;
      context.scale(ratio, ratio);
      // canvas 的尺寸改过之后要重新设字体
      context.font = font;
      context.fillStyle = color;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      for (const [x, y] of [
        [cellWidth / 2, cellHeight / 2],
        [cellWidth * 1.5, cellHeight * 1.5],
      ] as const) {
        context.save();
        context.translate(x, y);
        context.rotate((rotate * Math.PI) / 180);
        if (picture?.naturalWidth)
          context.drawImage(picture, -width / 2, -height / 2, width, height);
        else if (!image)
          lines.forEach((line, index) =>
            context.fillText(line, 0, (index - (lines.length - 1) / 2) * lineHeight),
          );
        context.restore();
      }
      tile = { url: canvas.toDataURL(), width: cellWidth * 2, height: cellHeight * 2 };
    }

    onMounted(() => void draw());
    watch(
      () => [content, image, width, height, rotate, gap, fontSize, color],
      () => void draw(),
      {
        deep: true,
      },
    );

    return () => {
      const layer = (
        <div
          aria-hidden="true"
          {...mergeAttrs<'div'>(
            {
              sx: [
                watermarkStyles.layer,
                fullscreen && watermarkStyles.fullscreen,
                tile &&
                  watermarkTileStyles.tile(`url(${tile.url})`, `${tile.width}px ${tile.height}px`),
              ],
            },
            propsLayer,
          )}
          data-watermark=""
        />
      );
      // 整页且没有包着内容：只渲染那一层
      if (fullscreen && children == null) return layer;
      return (
        <div {...mergeAttrs<'div'>({ sx: watermarkStyles.root }, rest)}>
          {children}
          {layer}
        </div>
      );
    };
  },
);
