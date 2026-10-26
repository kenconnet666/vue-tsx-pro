/**
 * three.js 画布（div > canvas）：渲染器的生命周期交给 useThree，这里只负责外层结构、降级与无障碍。
 *
 *   <ThreeCanvas
 *     sx={styles.hero}
 *     setup={(context) => {
 *       const mesh = new Mesh(new IcosahedronGeometry(1, 4), new MeshNormalMaterial());
 *       context.scene.add(mesh);
 *       return { frame: ({ time }) => (mesh.rotation.y = time) };
 *     }}
 *   />
 *
 * - 尺寸由外层 div 决定（默认占满父元素），canvas 铺满它，背景透明；
 * - 没有 WebGL、或 quality="off" 时显示 fallback，默认是一层主题色的柔和渐变；
 * - 默认是装饰（aria-hidden）；传了 aria-label 时是一张图（role="img"）；
 * - 渲染状态写在根元素的 data-state 上（idle / running / paused / still / fallback）。
 *
 * 部件：Root（div）、Canvas（canvas，重建时换新的一块）、Fallback（div，降级内容）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch, type VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../../utils/props';
import type { ThreeQuality } from './quality';
import { useThree, type ThreeContext, type ThreeSceneHandle, type ThreeStatus } from './renderer';
import { t } from '../../config/theme/tokens';

/** 未声明的属性落到外层 div 上 */
export interface ThreeCanvasProps extends PartProps<'div', 'role' | 'data-state'> {
  /** 搭场景：每次创建渲染器时调用一次（被回收、上下文丢失后会重新调用），返回每帧、尺寸变化、释放的回调 */
  setup: (context: ThreeContext) => ThreeSceneHandle | void;
  /**
   * 画质档位：像素比上限、粒子密度、抗锯齿；变了会重建。off 不创建 WebGL，显示 fallback
   * @default 'auto'
   */
  quality?: ThreeQuality;
  /** 暂停动画，停在当前画面 */
  paused?: boolean;
  /**
   * 渲染分辨率相对像素比的倍数（0.1–1）：平滑的渐变、模糊的效果降低它能大幅省下 GPU 开销
   * @default 1
   */
  resolution?: number;
  /** 没有 WebGL（或 quality 为 off）时显示的内容，默认是主题色的柔和渐变 */
  fallback?: VNodeChild;
  /** 渲染状态变化时调用（同根元素的 data-state），挂载时先调用一次：比如降级时改放一张静态图，或一次性的效果直接收尾 */
  onStatusChange?: (status: ThreeStatus) => void;
  /** canvas 的部件属性 */
  propsCanvas?: PartProps<'canvas', 'aria-hidden'>;
  /** 降级内容外层的部件属性 */
  propsFallback?: PartProps<'div', 'aria-hidden'>;
}

/** ThreeCanvas 的样式：root、canvas、fallback、fallbackGradient（默认的降级渐变） */
export const threeCanvasStyles = css.create({
  root: {
    position: 'relative',
    display: 'block',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  canvas: {
    position: 'absolute',
    inset: 0,
    display: 'block',
    width: '100%',
    height: '100%',
  },
  fallback: { position: 'absolute', inset: 0 },
  fallbackGradient: {
    backgroundImage: `radial-gradient(circle at 20% 25%, color-mix(in oklab, ${t.colors.accent} 28%, transparent), transparent 55%), radial-gradient(circle at 80% 70%, color-mix(in oklab, ${t.colors.chart3} 24%, transparent), transparent 55%), radial-gradient(circle at 60% 15%, color-mix(in oklab, ${t.colors.chart5} 18%, transparent), transparent 50%)`,
  },
});

/** three.js 画布：生命周期、降级、无障碍，场景由 setup 搭建 */
export const ThreeCanvas = _component(
  ({
    setup,
    quality = 'auto',
    paused = false,
    resolution = 1,
    fallback,
    onStatusChange,
    propsCanvas,
    propsFallback,
    ...rest
  }: ThreeCanvasProps) => {
    let canvas = _state.raw<HTMLCanvasElement | null>(null);
    const three = useThree({
      canvas: () => canvas,
      setup: (context) => setup(context),
      quality: () => quality,
      paused: () => paused,
      resolution: () => resolution,
    });
    // 挂载时先报告一次：quality="off" 一开始就是 fallback，之后不再变
    watch(
      () => three.status,
      (status) => onStatusChange?.(status),
      { immediate: true },
    );

    return () => {
      const labelled = rest['aria-label'] != null || rest['aria-labelledby'] != null;
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: threeCanvasStyles.root, 'aria-hidden': labelled ? undefined : true },
            rest,
            { role: labelled ? 'img' : undefined },
          )}
          data-state={three.status}
        >
          {three.status === 'fallback' ? (
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [
                    threeCanvasStyles.fallback,
                    fallback == null && threeCanvasStyles.fallbackGradient,
                  ],
                },
                propsFallback,
                { 'aria-hidden': true },
              )}
            >
              {fallback}
            </div>
          ) : (
            <canvas
              key={three.generation}
              {...mergeAttrs<'canvas'>({ sx: threeCanvasStyles.canvas }, propsCanvas, {
                'aria-hidden': true,
                ref: _toRef(canvas),
              })}
            />
          )}
        </div>
      );
    };
  },
);
