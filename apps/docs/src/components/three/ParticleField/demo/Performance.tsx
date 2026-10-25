// 不写 count 时粒子数按面积与画质决定（低画质少一半多）；渲染分辨率、暂停；off 时显示 fallback
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Field, Flex, Grid, Slider, Switch, ToggleGroup, ToggleItem, t } from '@vue-tsx-pro/ui';
import { ParticleField, type ThreeQuality } from '@vue-tsx-pro/ui/three';

const styles = css.create({
  stage: { height: '16rem', borderRadius: '_lg', backgroundColor: '_surfaceMuted' },
  fallback: {
    height: '100%',
    backgroundImage: `radial-gradient(${t.colors.accent} 1.5px, transparent 1.5px), radial-gradient(${t.colors.chart5} 1px, transparent 1px)`,
    backgroundSize: '64px 64px, 40px 40px',
    backgroundPosition: '0 0, 20px 28px',
    opacity: 0.5,
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
          <ToggleGroup _value={quality} required>
            <ToggleItem value="auto">自动</ToggleItem>
            <ToggleItem value="low">低</ToggleItem>
            <ToggleItem value="high">高</ToggleItem>
            <ToggleItem value="off">关</ToggleItem>
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
      <ParticleField
        sx={styles.stage}
        links
        quality={quality}
        resolution={resolution}
        paused={paused}
        fallback={<div {...css.attrs(styles.fallback)} />}
      />
    </Flex>
  );
});
