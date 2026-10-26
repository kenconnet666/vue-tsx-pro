// 3D 底座在真实浏览器里：渲染、主题换色、卸载释放、减少动态效果时只画一帧。
// 无头的 Firefox、WebKit 可能没有 WebGL：那时检查降级层
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { defineTheme, lightTheme, Provider, type Theme } from '@zerodep-dev/vue-tsx-pro-ui';
import {
  activeThreeContexts,
  ThreeCanvas,
  type ThreeContext,
} from '@zerodep-dev/vue-tsx-pro-ui/three';
import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';
import type { Color, WebGLRenderer } from 'three';
import { afterEach, expect, it } from 'vitest';
import { createApp, shallowRef, type App } from 'vue';

let app: App | undefined;
let host: HTMLElement | undefined;
afterEach(() => {
  app?.unmount();
  host?.remove();
});

const hasWebGL = !!document.createElement('canvas').getContext('webgl2');

/** 挂一个 320×200 的画布；返回根元素与 setup 拿到的上下文 */
function mountCanvas(theme: () => Theme, onSetup?: (context: ThreeContext) => void) {
  const contexts: ThreeContext[] = [];
  host = document.createElement('div');
  host.style.cssText = 'width: 320px; height: 200px';
  document.body.append(host);
  app = createApp(
    _component(() => () => (
      <Provider theme={theme()}>
        <ThreeCanvas
          setup={(context) => {
            contexts.push(context);
            onSetup?.(context);
          }}
        />
      </Provider>
    )),
  );
  app.mount(host);
  const root = () => host!.querySelector<HTMLElement>('[data-state]')!;
  return { root, contexts };
}

it('进入视口后创建渲染器并开始循环；没有 WebGL 时显示降级层', async () => {
  const { root, contexts } = mountCanvas(() => lightTheme);
  if (!hasWebGL) {
    await expect.poll(() => root().dataset.state).toBe('fallback');
    return;
  }
  await expect.poll(() => root().dataset.state).toBe('running');
  const canvas = root().querySelector('canvas')!;
  expect(canvas.width).toBe(Math.round(320 * contexts[0]!.size.pixelRatio));
  await expect.poll(() => contexts[0]!.renderer.info.render.frame).toBeGreaterThan(1);
});

it.runIf(hasWebGL)('换主题（这里改品牌色）：themeColors 给的颜色原地过渡到新取值', async () => {
  const theme = shallowRef<Theme>(lightTheme);
  let accent: Color | undefined;
  const { root } = mountCanvas(
    () => theme.value,
    ({ themeColors }) => (accent = themeColors({ accent: colors.accent }).accent),
  );
  await expect.poll(() => root().dataset.state).toBe('running');
  const object = accent!;
  const light = object.getHexString();
  theme.value = defineTheme(lightTheme, { colors: { accent: '#e5484d' } });
  await expect.poll(() => object.getHexString(), { timeout: 3000 }).toBe('e5484d');
  expect(light).toBe('3e63dd');
  expect(accent).toBe(object);
});

it.runIf(hasWebGL)('卸载：交还上下文，WebGL 上下文立即丢失', async () => {
  const { root, contexts } = mountCanvas(() => lightTheme);
  await expect.poll(() => root().dataset.state).toBe('running');
  const renderer: WebGLRenderer = contexts[0]!.renderer;
  expect(activeThreeContexts()).toBe(1);
  app!.unmount();
  app = undefined;
  expect(activeThreeContexts()).toBe(0);
  expect(renderer.getContext().isContextLost()).toBe(true);
});

it.runIf(hasWebGL)('主题关掉动效（时长为 0）：只画一帧静止画面', async () => {
  const still = defineTheme(lightTheme, {
    durations: { xs: '0ms', sm: '0ms', md: '0ms', lg: '0ms', xl: '0ms' },
  });
  const { root, contexts } = mountCanvas(() => still);
  await expect.poll(() => root().dataset.state).toBe('still');
  await new Promise((resolve) => setTimeout(resolve, 200));
  const frames = contexts[0]!.renderer.info.render.frame;
  expect(frames).toBe(1);
  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(contexts[0]!.renderer.info.render.frame).toBe(frames);
});
