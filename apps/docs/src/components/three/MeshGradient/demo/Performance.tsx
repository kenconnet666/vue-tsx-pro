// 画质、渲染分辨率（MeshGradient 默认 0.5：平滑的渐变降一半看不出差别）、跟随指针与暂停；off 时显示 fallback
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Field, Flex, Grid, Slider, Switch, ToggleGroup, ToggleItem, t } from '@vue-tsx-pro/ui';
import { MeshGradient, type ThreeQuality } from '@vue-tsx-pro/ui/three';

const styles = css.create({
  stage: { height: '16rem', borderRadius: '_lg' },
  fallback: {
    height: '100%',
    backgroundImage: `radial-gradient(circle at 25% 30%, ${t.colors.accent}, transparent 60%), radial-gradient(circle at 75% 70%, ${t.colors.chart5}, transparent 60%)`,
    opacity: 0.5,
  },
});

export default _component(() => {
  let quality = _state<ThreeQuality>('auto');
  let resolution = _state(0.5);
  let interactive = _state(true);
  let paused = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="12rem" gap="lg" align="end">
        <Field label="画质">
          <ToggleGroup _value={_bind(quality)} required>
            <ToggleItem value="auto">自动</ToggleItem>
            <ToggleItem value="low">低</ToggleItem>
            <ToggleItem value="high">高</ToggleItem>
            <ToggleItem value="off">关</ToggleItem>
          </ToggleGroup>
        </Field>
        <Field label="渲染分辨率">
          <Slider
            _value={_bind(resolution)}
            min={0.1}
            max={1}
            step={0.05}
            valueText={(value) => `${Math.round(value * 100)}%`}
          />
        </Field>
        <Flex gap="lg" wrap>
          <Switch _checked={_bind(interactive)}>跟随指针</Switch>
          <Switch _checked={_bind(paused)}>暂停</Switch>
        </Flex>
      </Grid>
      <MeshGradient
        sx={styles.stage}
        quality={quality}
        resolution={resolution}
        interactive={interactive}
        paused={paused}
        fallback={<div {...css.attrs(styles.fallback)} />}
      />
    </Flex>
  );
});
