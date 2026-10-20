// 3D 组件的测试工具：happy-dom 没有 WebGL，用假的渲染器顶替 three 的 WebGLRenderer，
// 用可控的 IntersectionObserver 决定画布在不在视口。测试文件里：
//
//   vi.mock('three', async (importOriginal) => ({
//     ...(await importOriginal<typeof import('three')>()),
//     WebGLRenderer: (await import('./fake-webgl')).FakeRenderer,
//     PMREMGenerator: (await import('./fake-webgl')).FakePMREMGenerator,   // 用到环境光时
//   }));
//   beforeEach(resetFakeWebGL);
import { Texture, type Camera, type Scene } from 'three';
import { afterEach, vi } from 'vitest';
import { setMaxThreeContexts } from '../core/quality';

/** 假的 WebGLRenderer：记下尺寸、渲染次数、最后渲染的场景与释放 */
export class FakeRenderer {
  static instances: FakeRenderer[] = [];
  static fail = false;
  renders = 0;
  disposed = false;
  lost = false;
  pixelRatio = 1;
  size = [0, 0];
  scene: Scene | undefined;
  params: { canvas: HTMLCanvasElement; antialias: boolean };
  constructor(params: { canvas: HTMLCanvasElement; antialias: boolean }) {
    this.params = params;
    if (FakeRenderer.fail) throw new Error('Error creating WebGL context.');
    FakeRenderer.instances.push(this);
  }
  setClearColor() {}
  setPixelRatio(ratio: number) {
    this.pixelRatio = ratio;
  }
  setSize(width: number, height: number) {
    this.size = [width, height];
  }
  render(scene: Scene, _camera: Camera) {
    this.scene = scene;
    this.renders++;
  }
  dispose() {
    this.disposed = true;
  }
  forceContextLoss() {
    this.lost = true;
  }
  getContext() {
    return { isContextLost: () => this.lost };
  }
}

/** 假的 PMREMGenerator：环境贴图要用渲染器预滤波，假渲染器做不了，给一张空纹理 */
export class FakePMREMGenerator {
  fromScene() {
    return { texture: new Texture() };
  }
  dispose() {}
}

const observers = new Set<{ callback: IntersectionObserverCallback; target?: Element }>();

/** 让所有画布进入（或离开）视口 */
export function setIntersecting(intersecting: boolean): void {
  for (const observer of observers) {
    observer.callback(
      [{ isIntersecting: intersecting, target: observer.target } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
  }
}

/** 目前登记的观察者（按创建顺序），单独控制某一块画布时用 */
export function intersectionObservers() {
  return [...observers];
}

/** 等一帧 */
export const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

/** 每个测试前调用：清空假渲染器的记录，换上可控的 IntersectionObserver */
export function resetFakeWebGL(): void {
  FakeRenderer.instances = [];
  FakeRenderer.fail = false;
  observers.clear();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      entry: { callback: IntersectionObserverCallback; target?: Element };
      constructor(callback: IntersectionObserverCallback) {
        this.entry = { callback };
        observers.add(this.entry);
      }
      observe(target: Element) {
        this.entry.target = target;
      }
      disconnect() {
        observers.delete(this.entry);
      }
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  setMaxThreeContexts(8);
});
