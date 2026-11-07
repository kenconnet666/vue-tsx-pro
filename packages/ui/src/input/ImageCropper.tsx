/**
 * 裁剪图片：头像、封面上传前裁一块。裁剪框固定在中间（按 aspect 的宽高比，round 时是圆的），图片在底下拖动、缩放，
 * 框里永远是图；裁好的用 handle 拿：toCanvas、toBlob、toFile（canvas 输出，可以指定输出的像素大小）。
 *
 *   <ImageCropper src={url} aspect={1} shape="round" handle={(cropper) => (avatar = cropper)} />
 *   const file = await avatar.toFile('avatar.png', { width: 256 });
 *
 * 建在 usePanZoom 上（frame 是裁剪框，cover 让缩放下限正好盖满它）：拖动平移、滚轮与触控板以指针为中心缩放、触屏捏合、
 * 双击放大；区域能聚焦，+ / − 缩放、0 还原、方向键微调。下面的工具条：缩小、缩放滑块、放大、还原。
 * 和 Upload 的 transform 配合：选到图片时弹出对话框裁剪，交回裁好的文件（见文档的示例）。
 * 部件：Root（div）、Viewport（区域）、Image（img）、Frame（裁剪框与四周的遮罩）、Toolbar。
 */
import { RotateCcw, ZoomIn, ZoomOut } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, watch } from 'vue';
import { IconButton } from '../base/IconButton';
import { useLang } from '../config/context';
import { useResizeObserver } from '../utils/dom/resize';
import { usePanZoom, type PanZoomRegion } from '../utils/dom/pan-zoom';
import { mergeAttrs, type PartProps } from '../utils/props';
import { focusRingStyles } from '../utils/style/styles';
import { Slider } from './Slider';
import { partAttrs } from '../config/styles';

/** 输出的选项：像素大小（只写一边时按宽高比算另一边；都不写时按图片原本的像素） */
export interface ImageCropOutput {
  /** 输出的宽（px） */
  width?: number;
  /** 输出的高（px） */
  height?: number;
}

/** 导出成图片的选项：像素大小加上类型（默认 image/png）与质量（jpeg、webp 用，0–1） */
export interface ImageCropFormat extends ImageCropOutput {
  /** 图片类型，默认 image/png */
  type?: string;
  /** 质量（image/jpeg、image/webp），0–1 */
  quality?: number;
}

/** handle 拿到的方法 */
export interface ImageCropperHandle {
  /** 裁好的画布；图片还没加载好时 null */
  toCanvas: (output?: ImageCropOutput) => HTMLCanvasElement | null;
  /** 裁好的图片（Blob），type 默认 image/png，quality 给 jpeg、webp */
  toBlob: (format?: ImageCropFormat) => Promise<Blob | null>;
  /** 裁好的文件（交给 Upload），类型按扩展名之外的 type 选项，默认 image/png */
  toFile: (name: string, format?: ImageCropFormat) => Promise<File | null>;
  /** 回到初始：图片盖满裁剪框、居中 */
  reset: () => void;
}

/** 裁剪框的形状 */
export interface ImageCropShapes {
  /** 矩形（默认） */
  rect: unknown;
  /** 圆形（头像）：输出的图四角透明 */
  round: unknown;
}

/** 未声明的属性落到根元素（div）上；aria-label 是区域的名称 */
export interface ImageCropperProps extends PartProps<'div'> {
  /** 图片地址（URL.createObjectURL(file) 或 data URL；别的域名的图要允许跨域，canvas 才能导出） */
  src: string;
  /** 裁剪框的宽高比（宽 / 高），默认 1 */
  aspect?: number;
  /** 裁剪框的形状，默认 rect */
  shape?: keyof ImageCropShapes;
  /** 最多放大到盖满裁剪框时的几倍，默认 4 */
  maxZoom?: number;
  /** 区域的高度，默认 18rem；宽度占满 */
  height?: string;
  /** 裁剪框离区域边缘至少多远（px），默认 24 */
  padding?: number;
  /** 拿到导出的方法 */
  handle?: (cropper: ImageCropperHandle) => void;
  /** 区域的部件属性 */
  propsViewport?: PartProps<'div', 'role' | 'tabindex'>;
  /** 工具条的部件属性 */
  propsToolbar?: PartProps<'div'>;
}

/** 部件的标记（data-scope="image-cropper"） */
const imageCropperPart = (part: string) => partAttrs({ name: 'ImageCropper' }, part);

/** ImageCropper 的样式：root、viewport、image、frame、round、toolbar、slider */
export const imageCropperStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: 0 },
  viewport: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '_md',
    backgroundColor: '_surfaceMuted',
    cursor: 'grab',
    userSelect: 'none',
  },
  image: {
    position: 'absolute',
    insetBlockStart: 0,
    left: 0,
    maxWidth: 'none',
    transformOrigin: '0 0',
    pointerEvents: 'none',
  },
  // 裁剪框：四周用很大的阴影压暗，框本身留一条细边
  frame: {
    position: 'absolute',
    boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.5)',
    outlineWidth: '1px',
    outlineStyle: 'solid',
    outlineColor: 'rgb(255 255 255 / 0.8)',
    pointerEvents: 'none',
  },
  round: { borderRadius: '50%' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '_xs' },
  slider: { flexGrow: 1, minWidth: 0 },
});

/** 动态样式（任意值，单独一个 create，见 COMPONENTS.md §4） */
const imageCropperSizeStyles = css.create({
  height: (value: string) => ({ height: value }),
  frame: (x: number, y: number, width: number, height: number) => ({
    left: x,
    top: y,
    width,
    height,
  }),
});

/** 裁剪图片：固定的裁剪框，图片在底下拖动缩放 */
export const ImageCropper = _component(
  ({
    src,
    aspect = 1,
    shape = 'rect',
    maxZoom = 4,
    height = '18rem',
    padding = 24,
    handle,
    propsViewport,
    propsToolbar,
    'aria-label': label,
    ...rest
  }: ImageCropperProps) => {
    const lang = useLang();
    const hintId = useId();
    let viewport = _state.raw<HTMLElement | null>(null);
    let image = _state.raw<HTMLImageElement | null>(null);
    /** 图片原本的像素大小；加载好之前 undefined */
    let natural = _state.raw<{ width: number; height: number } | undefined>(undefined);
    let size = _state.raw({ width: 0, height: 0 });

    /** 裁剪框：按宽高比放进区域中间，四周留 padding */
    const frame = (): Required<PanZoomRegion> => {
      const roomWidth = Math.max(size.width - padding * 2, 1);
      const roomHeight = Math.max(size.height - padding * 2, 1);
      const width = Math.min(roomWidth, roomHeight * aspect);
      const frameHeight = width / aspect;
      return {
        x: (size.width - width) / 2,
        y: (size.height - frameHeight) / 2,
        width,
        height: frameHeight,
      };
    };
    /** 正好盖满裁剪框的缩放 */
    const coverScale = () => {
      if (!natural) return 1;
      const { width, height: frameHeight } = frame();
      return Math.max(width / natural.width, frameHeight / natural.height);
    };

    const view = usePanZoom({
      viewport: () => viewport,
      bounds: () => natural,
      frame,
      cover: true,
      min: coverScale,
      max: () => coverScale() * maxZoom,
      step: 1.1,
      // 初始：盖满裁剪框、居中
      initial: () => {
        const box = frame();
        const scale = coverScale();
        const width = (natural?.width ?? 0) * scale;
        const imageHeight = (natural?.height ?? 0) * scale;
        return {
          x: box.x + (box.width - width) / 2,
          y: box.y + (box.height - imageHeight) / 2,
          scale,
        };
      },
    });

    useResizeObserver(
      () => viewport,
      () => {
        if (viewport) size = { width: viewport.clientWidth, height: viewport.clientHeight };
      },
    );
    // 换了图、区域大小或宽高比：回到初始
    watch(
      () => [natural, size, aspect] as const,
      () => view.reset(),
    );
    watch(
      () => src,
      () => (natural = undefined),
    );

    function toCanvas(output: ImageCropOutput = {}) {
      if (!image || !natural) return null;
      const box = frame();
      const { x, y, scale } = view;
      const source = {
        x: (box.x - x) / scale,
        y: (box.y - y) / scale,
        width: box.width / scale,
        height: box.height / scale,
      };
      const width = Math.round(
        output.width ?? (output.height ? output.height * aspect : source.width),
      );
      const outputHeight = Math.round(output.height ?? width / aspect);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = outputHeight;
      const context = canvas.getContext('2d');
      if (!context) return null;
      context.imageSmoothingQuality = 'high';
      if (shape === 'round') {
        context.beginPath();
        context.ellipse(
          width / 2,
          outputHeight / 2,
          width / 2,
          outputHeight / 2,
          0,
          0,
          Math.PI * 2,
        );
        context.clip();
      }
      context.drawImage(
        image,
        source.x,
        source.y,
        source.width,
        source.height,
        0,
        0,
        width,
        outputHeight,
      );
      return canvas;
    }

    const toBlob = ({ type = 'image/png', quality, ...output }: ImageCropFormat = {}) => {
      const canvas = toCanvas(output);
      return canvas
        ? new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
        : Promise.resolve(null);
    };
    const toFile: ImageCropperHandle['toFile'] = async (name, options = {}) => {
      const type = options.type ?? 'image/png';
      const blob = await toBlob({ ...options, type });
      return blob ? new File([blob], name, { type }) : null;
    };

    watch(
      () => viewport,
      (element) => {
        if (element) handle?.({ toCanvas, toBlob, toFile, reset: () => view.reset() });
      },
      { flush: 'post' },
    );

    return () => {
      const box = frame();
      const zoom = view.scale / coverScale();
      return (
        <div
          {...mergeAttrs<'div'>({ sx: imageCropperStyles.root, ...imageCropperPart('root') }, rest)}
        >
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [
                  imageCropperStyles.viewport,
                  imageCropperSizeStyles.height(height),
                  focusRingStyles.visible,
                ],
                ...imageCropperPart('viewport'),
              },
              propsViewport,
              {
                ...view.viewportProps,
                ref: _toRef(viewport),
                role: 'group',
                tabindex: 0,
                'aria-label': label ?? lang.cropLabel,
                'aria-describedby': hintId,
              },
            )}
          >
            <img
              ref={_toRef(image)}
              src={src}
              alt=""
              draggable={false}
              {...css.attrs(imageCropperStyles.image)}
              style={{ transform: view.transform }}
              onLoad={(event: Event) => {
                const element = event.target as HTMLImageElement;
                natural = { width: element.naturalWidth, height: element.naturalHeight };
              }}
            />
            <div
              aria-hidden="true"
              {...css.attrs(
                imageCropperStyles.frame,
                shape === 'round' && imageCropperStyles.round,
                imageCropperSizeStyles.frame(box.x, box.y, box.width, box.height),
              )}
            />
          </div>
          <span id={hintId} hidden>
            {lang.cropHint}
          </span>
          <div
            {...mergeAttrs<'div'>(
              { sx: imageCropperStyles.toolbar, ...imageCropperPart('toolbar') },
              propsToolbar,
            )}
          >
            <IconButton
              icon={ZoomOut}
              aria-label={lang.zoomOut}
              size="sm"
              variant="ghost"
              tone="neutral"
              disabled={zoom <= 1.001}
              onClick={() => view.zoomOut()}
            />
            <Slider
              _value={zoom}
              min={1}
              max={maxZoom}
              step={0.01}
              size="sm"
              aria-label={lang.cropZoom}
              valueText={(value) => `${Math.round(value * 100)}%`}
              sx={imageCropperStyles.slider}
              onUpdate:_value={(value: number) => view.zoomTo(coverScale() * value)}
            />
            <IconButton
              icon={ZoomIn}
              aria-label={lang.zoomIn}
              size="sm"
              variant="ghost"
              tone="neutral"
              disabled={zoom >= maxZoom - 0.001}
              onClick={() => view.zoomIn()}
            />
            <IconButton
              icon={RotateCcw}
              aria-label={lang.resetView}
              size="sm"
              variant="ghost"
              tone="neutral"
              onClick={() => view.reset()}
            />
          </div>
        </div>
      );
    };
  },
);
