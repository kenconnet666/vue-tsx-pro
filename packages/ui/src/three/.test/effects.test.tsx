// 效果：外层结构（画布在底层、内容在上层）、降级、着色器背景的 uniform 与色板、粒子数、重建时机
import { LineSegments, Points, ShaderMaterial, type Mesh, type Object3D } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, shallowRef, type VNodeChild } from 'vue';
import { mount } from '../../utils/.test/mount';
import { AuroraBackground } from '../background/AuroraBackground';
import { MeshGradient } from '../background/MeshGradient';
import { ShaderBackground } from '../background/ShaderBackground';
import { THEME_PALETTE_SIZE } from '../core/shaders';
import { ParticleField } from '../effects/ParticleField';
import { WaveGrid } from '../effects/WaveGrid';
import { FakeRenderer, frame, resetFakeWebGL, setIntersecting } from './fake-webgl';

vi.mock('three', async (importOriginal) => ({
  ...(await importOriginal<typeof import('three')>()),
  WebGLRenderer: (await import('./fake-webgl')).FakeRenderer,
}));

beforeEach(resetFakeWebGL);

/** 挂载后让画布进入视口，等它画出第一帧，返回场景里的对象 */
async function render(node: () => VNodeChild) {
  const root = mount(node);
  await nextTick();
  setIntersecting(true);
  await nextTick();
  await frame();
  const scene = FakeRenderer.instances.at(-1)?.scene;
  return { root, objects: (scene?.children ?? []) as Object3D[] };
}

const SHADE = 'vec4 shade(vec2 uv) { return vec4(themePalette(uv.x), 1.0); }';

describe('外层结构', () => {
  it('画布在底层（装饰），子元素在上层；没有 WebGL 时显示降级层', async () => {
    FakeRenderer.fail = true;
    const root = mount(() => (
      <MeshGradient class="hero">
        <h1>标题</h1>
      </MeshGradient>
    ));
    await nextTick();
    setIntersecting(true);
    await nextTick();
    const surface = root.querySelector('.hero')!;
    const [canvas, content] = surface.children;
    expect(canvas!.getAttribute('aria-hidden')).toBe('true');
    expect(canvas!.getAttribute('data-state')).toBe('fallback');
    expect(content!.textContent).toBe('标题');
  });

  it('没有子元素时不渲染内容层', () => {
    const root = mount(() => <AuroraBackground class="sky" />);
    expect(root.querySelector('.sky')!.children).toHaveLength(1);
  });
});

describe('ShaderBackground', () => {
  it('包成完整的着色器：自动 uniform、公共片段、色彩空间转换', async () => {
    const { objects } = await render(() => <ShaderBackground fragmentShader={SHADE} />);
    const material = (objects[0] as Mesh).material as ShaderMaterial;
    expect(material).toBeInstanceOf(ShaderMaterial);
    expect(Object.keys(material.uniforms)).toEqual(
      expect.arrayContaining([
        'uTime',
        'uResolution',
        'uPointer',
        'uDark',
        'uBackground',
        'uColors',
      ]),
    );
    expect(material.fragmentShader).toContain(SHADE);
    expect(material.fragmentShader).toContain('float snoise(vec3 v)');
    expect(material.fragmentShader).toContain('#include <colorspace_fragment>');
  });

  it('色板补齐到固定长度；自定义 uniform 原样交给材质，改 value 实时生效', async () => {
    const uniforms = { uRings: { value: 3 } };
    const { objects } = await render(() => (
      <ShaderBackground
        fragmentShader={SHADE}
        uniforms={uniforms}
        palette={['#ff0000', '#00ff00']}
      />
    ));
    const material = (objects[0] as Mesh).material as ShaderMaterial;
    expect(material.uniforms.uColors!.value).toHaveLength(THEME_PALETTE_SIZE);
    expect(material.uniforms.uColorCount!.value).toBe(2);
    expect(material.uniforms.uRings).toBe(uniforms.uRings);
  });

  it('时间按 speed 流动', async () => {
    const { objects } = await render(() => <ShaderBackground fragmentShader={SHADE} speed={2} />);
    const material = (objects[0] as Mesh).material as ShaderMaterial;
    await frame();
    await frame();
    expect(material.uniforms.uTime!.value).toBeGreaterThan(0);
  });

  it('着色器或色板变了重建场景，别的属性变了不重建', async () => {
    const shader = shallowRef(SHADE);
    const speed = shallowRef(1);
    await render(() => <ShaderBackground fragmentShader={shader.value} speed={speed.value} />);
    expect(FakeRenderer.instances).toHaveLength(1);
    speed.value = 3;
    await nextTick();
    expect(FakeRenderer.instances).toHaveLength(1);
    shader.value = SHADE.replace('uv.x', 'uv.y');
    await nextTick();
    setIntersecting(true);
    await nextTick();
    expect(FakeRenderer.instances).toHaveLength(2);
    expect(FakeRenderer.instances[0]!.disposed).toBe(true);
  });

  it('MeshGradient 的扭曲与颗粒是 uniform，实时生效', async () => {
    const grain = shallowRef(0.04);
    const { objects } = await render(() => <MeshGradient grain={grain.value} />);
    const material = (objects[0] as Mesh).material as ShaderMaterial;
    expect(material.uniforms.uGrain!.value).toBe(0.04);
    grain.value = 0.1;
    await nextTick();
    expect(material.uniforms.uGrain!.value).toBe(0.1);
  });
});

describe('ParticleField、WaveGrid', () => {
  it('粒子：指定数量时画这么多；连线时多一层线段', async () => {
    const { objects } = await render(() => <ParticleField count={50} links />);
    const points = objects.find((object) => object instanceof Points) as Points;
    expect(points.geometry.drawRange.count).toBe(50);
    expect(objects.some((object) => object instanceof LineSegments)).toBe(true);
  });

  it('粒子：不连线时没有线段层', async () => {
    const { objects } = await render(() => <ParticleField count={20} />);
    expect(objects.some((object) => object instanceof LineSegments)).toBe(false);
  });

  it('地形：grid 是线段，dots 是点', async () => {
    const grid = await render(() => <WaveGrid />);
    expect(grid.objects[0]).toBeInstanceOf(LineSegments);
    const dots = await render(() => <WaveGrid variant="dots" />);
    expect(dots.objects[0]).toBeInstanceOf(Points);
  });
});
