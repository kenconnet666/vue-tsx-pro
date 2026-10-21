// 画质、渲染分辨率与暂停；quality="off" 时不创建 WebGL，显示 fallback（没有 WebGL 时也是它）
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Field, Flex, Grid, Slider, Switch, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';
import { ShaderBackground, type ThreeQuality } from '@vue-tsx-pro/ui/three';

const PLASMA = /* glsl */ `
vec4 shade(vec2 uv) {
  vec2 p = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 3.0;
  float t = uTime * 0.6;
  float v = sin(p.x + t) + sin(p.y * 1.3 - t) + sin(length(p) * 2.0 - t * 1.5);
  return vec4(themePalette(v * 0.16 + 0.5), 1.0);
}
`;

const styles = stylex.create({
  stage: { height: '16rem', borderRadius: '_lg' },
  // 静态的替代画面：同样的色调，一层 CSS 渐变
  fallback: {
    height: '100%',
    backgroundImage: 'linear-gradient(120deg, _colors.accent, _colors.chart5 55%, _colors.chart6)',
    opacity: 0.6,
  },
});

export default _component(() => {
  let quality = _state<ThreeQuality>('auto');
  let resolution = _state(1);
  let paused = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="12rem" gap="lg" align="end">
        <Field label="画质">
          <ToggleGroup value={_bind(quality)} required>
            <ToggleItem value="auto">自动</ToggleItem>
            <ToggleItem value="low">低</ToggleItem>
            <ToggleItem value="high">高</ToggleItem>
            <ToggleItem value="off">关</ToggleItem>
          </ToggleGroup>
        </Field>
        <Field label="渲染分辨率">
          <Slider
            value={_bind(resolution)}
            min={0.1}
            max={1}
            step={0.05}
            valueText={(value) => `${Math.round(value * 100)}%`}
          />
        </Field>
        <Switch checked={_bind(paused)}>暂停</Switch>
      </Grid>
      <ShaderBackground
        sx={styles.stage}
        fragmentShader={PLASMA}
        quality={quality}
        resolution={resolution}
        paused={paused}
        fallback={<div {...stylex.attrs(styles.fallback)} />}
      />
    </Flex>
  );
});
