// 画质（网格的细分随它变）、渲染分辨率、跟随指针与暂停；off 时显示 fallback
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Field, Flex, Grid, Slider, Switch, ToggleGroup, ToggleItem, t } from '@vue-tsx-pro/ui';
import { WaveGrid, type ThreeQuality } from '@vue-tsx-pro/ui/three';

const styles = stylex.create({
  stage: { height: '16rem', borderRadius: '_lg', backgroundColor: '_surfaceMuted' },
  // 静态的替代画面：一层点阵
  fallback: {
    height: '100%',
    backgroundImage: `radial-gradient(${t.colors.borderStrong} 1px, transparent 1px)`,
    backgroundSize: '18px 18px',
  },
});

export default _component(() => {
  let quality = _state<ThreeQuality>('auto');
  let resolution = _state(1);
  let interactive = _state(true);
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
            min={0.25}
            max={1}
            step={0.05}
            valueText={(value) => `${Math.round(value * 100)}%`}
          />
        </Field>
        <Flex gap="lg" wrap>
          <Switch checked={_bind(interactive)}>指针下隆起</Switch>
          <Switch checked={_bind(paused)}>暂停</Switch>
        </Flex>
      </Grid>
      <WaveGrid
        sx={styles.stage}
        quality={quality}
        resolution={resolution}
        interactive={interactive}
        paused={paused}
        fallback={<div {...stylex.attrs(styles.fallback)} />}
      />
    </Flex>
  );
});
