// 画质档位（off 不创建 WebGL，显示 fallback）、渲染分辨率与暂停；onStatusChange 报告渲染状态
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Badge,
  Card,
  Field,
  Flex,
  Grid,
  Slider,
  Small,
  Switch,
  ToggleGroup,
  ToggleItem,
  t,
} from '@vue-tsx-pro/ui';
import { ThreeCanvas, type ThreeQuality, type ThreeStatus } from '@vue-tsx-pro/ui/three';
import { colors } from '@vue-tsx-pro/ui/tokens';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three';

const QUALITIES: { value: ThreeQuality; label: string }[] = [
  { value: 'auto', label: '自动' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'off', label: '关' },
];

const styles = css.create({
  stage: { height: '18rem' },
  fallback: {
    display: 'grid',
    placeItems: 'center',
    height: '100%',
    color: '_textMuted',
    backgroundImage: `radial-gradient(circle, ${t.colors.accentSoft}, transparent 65%)`,
  },
});

/** 斐波那契球面上均匀分布的点，带一点起伏 */
function spherePoints(count: number) {
  const positions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index++) {
    const y = 1 - (index / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = index * golden;
    const scale = 1.6 + Math.sin(index * 0.37) * 0.08;
    positions.set(
      [Math.cos(angle) * radius * scale, y * scale, Math.sin(angle) * radius * scale],
      index * 3,
    );
  }
  return positions;
}

export default _component(() => {
  let quality = _state<ThreeQuality>('auto');
  let resolution = _state(1);
  let paused = _state(false);
  let status = _state<ThreeStatus>('idle');
  let info = _state({ level: '', count: 0, pixelRatio: 1 });
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="14rem" gap="lg" align="end">
        <Field label="画质">
          <ToggleGroup _value={quality} required>
            {QUALITIES.map((item) => (
              <ToggleItem key={item.value} value={item.value}>
                {item.label}
              </ToggleItem>
            ))}
          </ToggleGroup>
        </Field>
        <Field label="渲染分辨率">
          <Slider
            _value={resolution}
            min={0.25}
            max={1}
            step={0.05}
            valueText={(value) => `${Math.round(value * 100)}%`}
          />
        </Field>
        <Switch _checked={paused}>暂停</Switch>
      </Grid>
      <Flex gap="sm" align="center">
        <Badge tone={status === 'fallback' ? 'warning' : 'neutral'}>{status}</Badge>
        <Small tone="muted">
          {status === 'fallback'
            ? '没有渲染器，显示降级内容'
            : `${info.level} · ${info.count} 个粒子 · 像素比 ${info.pixelRatio.toFixed(2)}`}
        </Small>
      </Flex>
      <Card padding="none">
        <ThreeCanvas
          sx={styles.stage}
          quality={quality}
          resolution={resolution}
          paused={paused}
          onStatusChange={(next) => (status = next)}
          fallback={<div {...css.attrs(styles.fallback)}>特效已关闭</div>}
          setup={({ scene, quality: resolved, size, themeColors }) => {
            const count = Math.round(12000 * resolved.density);
            const geometry = new BufferGeometry();
            geometry.setAttribute('position', new BufferAttribute(spherePoints(count), 3));
            const material = new PointsMaterial({
              size: 0.03,
              transparent: true,
              opacity: 0.9,
              blending: AdditiveBlending,
              depthWrite: false,
            });
            material.color = themeColors({ accent: colors.accent }).accent;
            const points = new Points(geometry, material);
            scene.add(points);
            info = { level: resolved.level, count, pixelRatio: size.pixelRatio };
            return {
              frame: ({ time }) => points.rotation.set(time * 0.12, time * 0.2, 0),
              resize: (next) => (info = { ...info, pixelRatio: next.pixelRatio }),
            };
          }}
        />
      </Card>
    </Flex>
  );
});
