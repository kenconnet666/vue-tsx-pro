/**
 * 模型查看器（div）：加载 glTF / GLB（或直接给一个 three 的对象），自动居中、缩放到合适的大小，
 * 拖动环绕查看（松手带惯性），方向键也能转；没在拖时缓缓自转。参考 Google 的 <model-viewer>。
 *
 *   <ModelViewer src="/models/chair.glb" alt="扶手椅，胡桃木与灰色布面" />
 *   <ModelViewer object={mesh} rotationSpeed={0} zoom sx={styles.viewer} />
 *
 * 光照是一间柔和的摄影棚（RoomEnvironment 的环境光），金属、粗糙度材质都能正确地反光；exposure 调整体亮度。
 * 加载时中间显示转圈，失败时显示语言包里的提示（onError 拿到原因）。写了 alt 时整块是带名称的图像（role="img"）。
 * 默认正方形，尺寸由使用方决定。减少动态效果时不自转，拖动仍可用。
 *
 * 部件：Root（div）、Canvas（ThreeCanvas）、Content（加载中与出错的提示）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  ACESFilmicToneMapping,
  Box3,
  Group,
  PerspectiveCamera,
  PMREMGenerator,
  Sphere,
  Vector3,
  type Object3D,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Small } from '../../base/Text';
import { Spinner } from '../../base/Spinner';
import { useLang } from '../../config/context';
import { EffectSurface, type EffectProps } from '../core/EffectSurface';
import { createOrbit } from '../core/orbit';
import { mergePartProps, type PartProps } from '../../utils/props';

/** 加载状态 */
export interface ModelViewerStatuses {
  /** 加载中 */
  loading: unknown;
  /** 已显示 */
  loaded: unknown;
  /** 加载失败 */
  error: unknown;
}

/** 未声明的属性落到外层 div 上 */
export interface ModelViewerProps extends Omit<EffectProps, 'children' | 'onLoad' | 'onError'> {
  /** 模型的地址（glTF / GLB）；和 object 二选一 */
  src?: string;
  /** 直接给一个 three 的对象（程序生成的模型）；和 src 二选一 */
  object?: Object3D;
  /** 模型的文字描述：写了时整块是 role="img"、以它为名称 */
  alt?: string;
  /**
   * 自转速度（度 / 秒）；0 时不自转
   * @default 20
   */
  rotationSpeed?: number;
  /**
   * 可以拖动、用方向键环绕查看
   * @default true
   */
  controls?: boolean;
  /**
   * 滚轮、+ / - 键缩放
   * @default false
   */
  zoom?: boolean;
  /**
   * 一开始的角度（度）：yaw 绕竖轴，pitch 从上往下看为正
   * @default { yaw: 30, pitch: 15 }
   */
  orbit?: { yaw: number; pitch: number };
  /**
   * 曝光：整体亮度
   * @default 1
   */
  exposure?: number;
  /** 加载完成 */
  onLoad?: (model: Object3D) => void;
  /** 加载失败 */
  onError?: (error: unknown) => void;
}

/** ModelViewer 的样式：root、interactive、dragging、content、overlay */
export const modelViewerStyles = css.create({
  root: { aspectRatio: '1', width: '100%', outlineStyle: 'none' },
  interactive: { cursor: 'grab', touchAction: 'pan-y' },
  dragging: { cursor: 'grabbing' },
  // 内容层不定位：提示按外层（整块）铺满、居中
  content: { position: 'static' },
  // 加载中、出错的提示：盖在画布中间
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
});

const DEG = Math.PI / 180;
const FOV = 35;
/** 模型（外接球）占画面短边的比例 */
const FIT = 0.85;
/** 缩放的范围：相对合适距离的倍数 */
const ZOOM_RANGE = [0.5, 2.5] as const;

/** 模型查看器 */
export const ModelViewer = _component(
  ({
    src,
    object,
    alt,
    rotationSpeed = 20,
    controls = true,
    zoom = false,
    orbit: initial = { yaw: 30, pitch: 15 },
    exposure = 1,
    onLoad,
    onError,
    ...rest
  }: ModelViewerProps) => {
    const lang = useLang();
    let status = _state<keyof ModelViewerStatuses>('loading');
    const start = _untrack(initial);
    const orbit = createOrbit({ yaw: start.yaw * DEG, pitch: start.pitch * DEG, pitchLimit: 1.4 });
    let distance = 1;
    // 场景建好后换成真正的 invalidate：静止模式下交互也要重画
    let redraw = () => {};

    function onKeydown(event: KeyboardEvent) {
      if (!controls) return;
      const step = 15 * DEG;
      const moves: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const move = moves[event.key];
      if (move) orbit.nudge(...move);
      else if (zoom && (event.key === '+' || event.key === '='))
        distance = Math.max(ZOOM_RANGE[0], distance / 1.15);
      else if (zoom && event.key === '-') distance = Math.min(ZOOM_RANGE[1], distance * 1.15);
      else return;
      event.preventDefault();
      redraw();
    }

    function onWheel(event: WheelEvent) {
      if (!zoom) return;
      event.preventDefault();
      distance = Math.min(
        ZOOM_RANGE[1],
        Math.max(ZOOM_RANGE[0], distance * Math.exp(event.deltaY * 0.001)),
      );
      redraw();
    }

    return () => (
      <EffectSurface
        {...rest}
        sx={[
          modelViewerStyles.root,
          controls && modelViewerStyles.interactive,
          orbit.dragging && modelViewerStyles.dragging,
          rest.sx,
        ]}
        role={alt ? 'img' : undefined}
        aria-label={alt}
        aria-busy={status === 'loading' || undefined}
        tabindex={controls ? 0 : undefined}
        data-status={status}
        {...(controls ? orbit.handlers : {})}
        onKeydown={onKeydown}
        onWheel={onWheel}
        propsContent={mergePartProps<PartProps<'div'>>(
          { sx: modelViewerStyles.content },
          rest.propsContent,
        )}
        sceneKey={src ?? object?.uuid}
        setup={({ renderer, scene, still, invalidate }) => {
          redraw = invalidate;
          renderer.toneMapping = ACESFilmicToneMapping;
          renderer.toneMappingExposure = exposure;
          const environment = new PMREMGenerator(renderer);
          scene.environment = environment.fromScene(new RoomEnvironment(), 0.04).texture;

          const camera = new PerspectiveCamera(FOV, 1, 0.01, 100);
          // 合适的距离：外接球（半径 1）正好占短边的 FIT
          let fit = 1 / Math.sin((FOV * DEG) / 2) / FIT;
          const holder = new Group();
          scene.add(holder);
          let disposed = false;

          status = 'loading';
          const source = object
            ? Promise.resolve(object)
            : new GLTFLoader().loadAsync(src ?? '').then((gltf) => gltf.scene);
          source.then(
            (model) => {
              if (disposed) return;
              // 居中，缩放到外接球半径为 1
              const sphere = new Box3().setFromObject(model).getBoundingSphere(new Sphere());
              const scale = sphere.radius > 0 ? 1 / sphere.radius : 1;
              holder.scale.setScalar(scale);
              holder.position.copy(sphere.center).multiplyScalar(-scale);
              holder.add(model);
              status = 'loaded';
              onLoad?.(model);
              invalidate();
            },
            (error: unknown) => {
              if (disposed) return;
              status = 'error';
              onError?.(error);
            },
          );

          const eye = new Vector3();
          const place = () => {
            const d = fit * distance;
            eye.set(
              Math.sin(orbit.yaw) * Math.cos(orbit.pitch),
              Math.sin(orbit.pitch),
              Math.cos(orbit.yaw) * Math.cos(orbit.pitch),
            );
            camera.position.copy(eye.multiplyScalar(d));
            camera.lookAt(0, 0, 0);
          };

          return {
            resize: (size, context) => {
              camera.aspect = size.width / Math.max(size.height, 1);
              fit = 1 / Math.sin((FOV * DEG) / 2) / FIT / Math.min(1, camera.aspect);
              camera.updateProjectionMatrix();
              context.camera = camera;
              place();
            },
            frame: ({ delta }) => {
              // 自转是相机绕模型反向转：看起来模型朝 rotationSpeed 的方向转
              orbit.step(delta, still ? 0 : -rotationSpeed * DEG);
              place();
            },
            dispose: () => {
              disposed = true;
              scene.environment?.dispose();
              environment.dispose();
              redraw = () => {};
            },
          };
        }}
      >
        {status !== 'loaded' && (
          <div {...css.attrs(modelViewerStyles.overlay)}>
            {status === 'loading' ? (
              <Spinner label={lang.modelViewerLoading} />
            ) : (
              <Small tone="muted">{lang.modelViewerError}</Small>
            )}
          </div>
        )}
      </EffectSurface>
    );
  },
);
