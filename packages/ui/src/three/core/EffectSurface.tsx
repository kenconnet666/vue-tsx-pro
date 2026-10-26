/**
 * 效果的外层结构（ShaderBackground、ParticleField、WaveGrid 等共用）：画布铺在底层，内容叠在上面。
 *
 *   <MeshGradient sx={styles.hero}>
 *     <h1>标题</h1>            ← 内容照常排版、可以交互；画布在它下面，不接收指针
 *   </MeshGradient>
 *
 * 根元素建立层叠上下文（isolation），画布层在内容下面、在根元素的背景上面；没有内容时只是一块效果。
 * 尺寸由使用方决定（sx 给高度，或由内容撑开）。画布是装饰，读屏跳过；要描述画面时给 propsCanvas 写 aria-label。
 *
 * 部件：Root（div）、Canvas（ThreeCanvas）、Content（div，有内容时才有）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../../utils/props';
import type { ThreeQuality } from './quality';
import type { ThreeContext, ThreeSceneHandle } from './renderer';
import { ThreeCanvas, type ThreeCanvasProps } from './ThreeCanvas';

/** 各种效果共有的属性；未声明的属性落到外层 div 上 */
export interface EffectProps extends PartProps<'div'> {
  /**
   * 画质档位：像素比上限、粒子密度、抗锯齿；off 不渲染，显示 fallback
   * @default 'auto'
   */
  quality?: ThreeQuality;
  /** 暂停动画，停在当前画面 */
  paused?: boolean;
  /** 渲染分辨率相对像素比的倍数（0.1–1），见 ThreeCanvas；各效果有自己的默认值 */
  resolution?: number;
  /** 没有 WebGL（或 quality 为 off）时显示的内容，默认是主题色的柔和渐变 */
  fallback?: VNodeChild;
  /** 画布（ThreeCanvas）的部件属性 */
  propsCanvas?: Omit<Partial<ThreeCanvasProps>, 'setup'>;
  /** 内容外层的部件属性 */
  propsContent?: PartProps<'div'>;
  /** 叠在效果上面的内容 */
  children?: VNodeChild;
}

/** EffectSurface 的样式：root、canvas、content */
export const effectSurfaceStyles = css.create({
  root: { position: 'relative', isolation: 'isolate', overflow: 'hidden' },
  canvas: {
    position: 'absolute',
    inset: 0,
    zIndex: -1,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  content: { position: 'relative' },
});

/** EffectSurface 的属性：效果的公共属性加上搭场景的 setup */
export interface EffectSurfaceProps extends EffectProps {
  /** 搭场景，见 ThreeCanvas */
  setup: (context: ThreeContext) => ThreeSceneHandle | void;
  /** 变了就重建场景（着色器、色板这类建好后不再改的配置） */
  sceneKey?: string;
}

/** 效果的外层结构：底层画布 + 上层内容 */
export const EffectSurface = _component(
  ({
    setup,
    sceneKey,
    quality,
    paused,
    resolution,
    fallback,
    propsCanvas,
    propsContent,
    children,
    ...rest
  }: EffectSurfaceProps) => {
    return () => (
      <div {...mergeAttrs<'div'>({ sx: effectSurfaceStyles.root }, rest)}>
        <ThreeCanvas
          key={sceneKey}
          {...mergePartProps<ThreeCanvasProps>(
            { sx: effectSurfaceStyles.canvas, setup, quality, paused, resolution, fallback },
            propsCanvas,
          )}
        />
        {hasContent(children) && (
          <div {...mergeAttrs<'div'>({ sx: effectSurfaceStyles.content }, propsContent)}>
            {children}
          </div>
        )}
      </div>
    );
  },
);
