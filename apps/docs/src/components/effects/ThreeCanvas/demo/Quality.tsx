import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Badge, Card, Flex, Switch, Text, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';
import { ThreeCanvas, type ThreeQuality } from '@vue-tsx-pro/ui/three';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Points, PointsMaterial } from 'three';

const QUALITIES: { value: ThreeQuality; label: string }[] = [
  { value: 'auto', label: '自动' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
];

const styles = stylex.create({
  stage: { height: '18rem' },
  stats: { color: '_textMuted' },
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
  let paused = _state(false);
  let info = _state({ level: '', count: 0, pixelRatio: 1 });
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" align="center" wrap>
        <ToggleGroup value={_bind(quality)} required aria-label="画质">
          {QUALITIES.map((item) => (
            <ToggleItem key={item.value} value={item.value}>
              {item.label}
            </ToggleItem>
          ))}
        </ToggleGroup>
        <Switch checked={_bind(paused)}>暂停</Switch>
        <Flex gap="sm" align="center" sx={styles.stats}>
          <Badge>{info.level}</Badge>
          <Text size="sm">
            {info.count} 个粒子 · 像素比 {info.pixelRatio}
          </Text>
        </Flex>
      </Flex>
      <Card padding="none">
        <ThreeCanvas
          sx={styles.stage}
          quality={quality}
          paused={paused}
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
