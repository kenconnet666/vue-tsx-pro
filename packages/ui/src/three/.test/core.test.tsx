// 3D 底座：happy-dom 没有 WebGL，降级与无障碍直接测；生命周期（创建、循环、静止、回收、上下文丢失、释放）用假的渲染器测
import { _component } from '@vue-tsx-pro/tsx';
import { BufferGeometry, Color, Mesh, MeshBasicMaterial, Points, Texture } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import { mount } from '../../utils/.test/mount';
import { disposeObject } from '../core/dispose';
import { activeThreeContexts, resolveThreeQuality, setMaxThreeContexts } from '../core/quality';
import { shaderChunks } from '../core/shaders';
import { readThemeColor, useThemeColors } from '../core/theme-colors';
import { ThreeCanvas } from '../core/ThreeCanvas';
import {
  FakeRenderer,
  frame,
  intersectionObservers,
  resetFakeWebGL,
  setIntersecting,
} from './fake-webgl';

vi.mock('three', async (importOriginal) => ({
  ...(await importOriginal<typeof import('three')>()),
  WebGLRenderer: (await import('./fake-webgl')).FakeRenderer,
}));

beforeEach(resetFakeWebGL);

describe('降级与无障碍', () => {
  it('没有 WebGL：显示主题色渐变的降级层，data-state="fallback"', async () => {
    FakeRenderer.fail = true;
    const root = mount(() => <ThreeCanvas setup={() => {}} />);
    await nextTick();
    setIntersecting(true);
    await nextTick();
    const canvas = root.firstElementChild!;
    expect(canvas.getAttribute('data-state')).toBe('fallback');
    expect(canvas.querySelector('canvas')).toBeNull();
    expect(canvas.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
    expect(activeThreeContexts()).toBe(0);
  });

  it('自定义降级内容', async () => {
    FakeRenderer.fail = true;
    const root = mount(() => (
      <ThreeCanvas setup={() => {}} fallback={<img alt="" src="x.png" />} />
    ));
    await nextTick();
    setIntersecting(true);
    await nextTick();
    expect(root.querySelector('img')).not.toBeNull();
  });

  it('默认是装饰（aria-hidden）；有 aria-label 时是一张图', () => {
    const root = mount(() => (
      <>
        <ThreeCanvas setup={() => {}} />
        <ThreeCanvas setup={() => {}} aria-label="旋转的地球" />
      </>
    ));
    const [decorative, image] = root.children;
    expect(decorative!.getAttribute('aria-hidden')).toBe('true');
    expect(decorative!.hasAttribute('role')).toBe(false);
    expect(image!.getAttribute('role')).toBe('img');
    expect(image!.hasAttribute('aria-hidden')).toBe(false);
  });
});

describe('生命周期', () => {
  it('进入视口才创建渲染器；循环里每帧调用 frame 并渲染', async () => {
    const frames: number[] = [];
    const root = mount(() => (
      <ThreeCanvas setup={() => ({ frame: ({ time }) => void frames.push(time) })} />
    ));
    await nextTick();
    expect(FakeRenderer.instances).toHaveLength(0);
    expect(root.firstElementChild!.getAttribute('data-state')).toBe('idle');

    await nextTick();
    setIntersecting(true);
    await nextTick();
    expect(FakeRenderer.instances).toHaveLength(1);
    expect(root.firstElementChild!.getAttribute('data-state')).toBe('running');
    await frame();
    await frame();
    expect(frames.length).toBeGreaterThanOrEqual(2);
    expect(FakeRenderer.instances[0]!.renders).toBeGreaterThanOrEqual(2);
  });

  it('滚出视口、paused 时停下', async () => {
    const paused = shallowRef(false);
    const root = mount(() => <ThreeCanvas paused={paused.value} setup={() => {}} />);
    await nextTick();
    setIntersecting(true);
    await nextTick();
    const state = () => root.firstElementChild!.getAttribute('data-state');
    expect(state()).toBe('running');
    setIntersecting(false);
    await nextTick();
    expect(state()).toBe('paused');
    setIntersecting(true);
    await nextTick();
    paused.value = true;
    await nextTick();
    expect(state()).toBe('paused');
    await frame();
    const renders = FakeRenderer.instances[0]!.renders;
    await frame();
    await frame();
    expect(FakeRenderer.instances[0]!.renders).toBe(renders);
  });

  it('减少动态效果：只画一帧静止画面', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      addEventListener() {},
      removeEventListener() {},
    }));
    const root = mount(() => <ThreeCanvas setup={() => {}} />);
    await nextTick();
    setIntersecting(true);
    await nextTick();
    expect(root.firstElementChild!.getAttribute('data-state')).toBe('still');
    for (let i = 0; i < 4; i++) await frame();
    expect(FakeRenderer.instances[0]!.renders).toBe(1);
  });

  it('卸载：释放几何体、材质、纹理与渲染器，交还上下文', async () => {
    const geometry = new BufferGeometry();
    const material = new MeshBasicMaterial({ map: new Texture() });
    const spies = [
      vi.spyOn(geometry, 'dispose'),
      vi.spyOn(material, 'dispose'),
      vi.spyOn(material.map!, 'dispose'),
    ];
    const dispose = vi.fn();
    const shown = shallowRef(true);
    mount(() =>
      shown.value ? (
        <ThreeCanvas
          setup={({ scene }) => {
            scene.add(new Mesh(geometry, material));
            return { dispose };
          }}
        />
      ) : null,
    );
    await nextTick();
    setIntersecting(true);
    await nextTick();
    expect(activeThreeContexts()).toBe(1);
    shown.value = false;
    await nextTick();
    for (const spy of spies) expect(spy).toHaveBeenCalled();
    expect(dispose).toHaveBeenCalled();
    expect(FakeRenderer.instances[0]!.disposed).toBe(true);
    expect(FakeRenderer.instances[0]!.lost).toBe(true);
    expect(activeThreeContexts()).toBe(0);
  });

  it('上下文丢失：换一块新 canvas 重建；连续丢失三次后降级', async () => {
    const setup = vi.fn();
    const root = mount(() => <ThreeCanvas setup={setup} />);
    await nextTick();
    setIntersecting(true);
    await nextTick();
    for (let loss = 1; loss <= 3; loss++) {
      const canvas = root.querySelector('canvas')!;
      canvas.dispatchEvent(new Event('webglcontextlost'));
      await nextTick();
      await nextTick();
      if (loss < 3) {
        expect(root.querySelector('canvas')).not.toBe(canvas);
        setIntersecting(true);
        await nextTick();
        expect(setup).toHaveBeenCalledTimes(loss + 1);
      }
    }
    expect(root.firstElementChild!.getAttribute('data-state')).toBe('fallback');
    expect(activeThreeContexts()).toBe(0);
  });

  it('上下文名额：满了回收最久没出现在视口里的，它回到视口时重建', async () => {
    setMaxThreeContexts(1);
    const setups: string[] = [];
    const root = mount(() => (
      <>
        <ThreeCanvas setup={() => void setups.push('a')} />
        <ThreeCanvas setup={() => void setups.push('b')} />
      </>
    ));
    await nextTick();
    const [a, b] = intersectionObservers();
    const show = (observer: typeof a, intersecting: boolean) =>
      observer!.callback(
        [{ isIntersecting: intersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    show(a, true);
    await nextTick();
    expect(setups).toEqual(['a']);
    // b 进入视口时 a 还在视口里：排队
    show(b, true);
    await nextTick();
    expect(setups).toEqual(['a']);
    expect(root.children[1]!.getAttribute('data-state')).toBe('idle');
    // a 滚出视口：b 拿到名额
    show(a, false);
    await nextTick();
    expect(setups).toEqual(['a', 'b']);
    expect(root.children[0]!.getAttribute('data-state')).toBe('idle');
    expect(activeThreeContexts()).toBe(1);
  });
});

describe('工具', () => {
  it('画质档位：像素比上限与密度', () => {
    expect(resolveThreeQuality('low')).toMatchObject({ pixelRatio: 1, antialias: false });
    expect(resolveThreeQuality('high')).toMatchObject({ pixelRatio: 2, density: 1 });
    expect(['low', 'medium', 'high']).toContain(resolveThreeQuality('auto').level);
  });

  it('disposeObject 释放子孙的几何体与材质', () => {
    const geometry = new BufferGeometry();
    const material = new MeshBasicMaterial();
    const group = new Mesh();
    group.add(new Points(geometry, material));
    const spies = [vi.spyOn(geometry, 'dispose'), vi.spyOn(material, 'dispose')];
    disposeObject(group);
    for (const spy of spies) expect(spy).toHaveBeenCalled();
  });

  it('readThemeColor：CSS 颜色转成线性空间的 THREE.Color', () => {
    const color = new Color();
    expect(readThemeColor(document.body, 'rgb(255, 0, 0)', color)).toBe(true);
    expect(color.getHexString()).toBe('ff0000');
  });

  it('useThemeColors：颜色来源变了原地换色，Color 对象不变', async () => {
    const accent = shallowRef('rgb(0, 0, 255)');
    let palette: { accent: Color } | undefined;
    const onChange = vi.fn();
    const Probe = _component(() => {
      palette = useThemeColors(
        () => document.body,
        () => ({ accent: accent.value }),
        {
          onChange,
        },
      );
      return () => null;
    });
    mount(() => <Probe />);
    await nextTick();
    const color = palette!.accent;
    expect(color.getHexString()).toBe('0000ff');
    accent.value = 'rgb(0, 255, 0)';
    await vi.waitFor(() => expect(palette!.accent.getHexString()).toBe('00ff00'));
    expect(palette!.accent).toBe(color);
    expect(onChange).toHaveBeenCalled();
  });

  it('着色器片段：色板长度与噪声函数', () => {
    expect(shaderChunks.themePalette).toContain('#define THEME_PALETTE_SIZE 6');
    expect(shaderChunks.simplexNoise).toContain('float snoise(vec3 v)');
  });
});
