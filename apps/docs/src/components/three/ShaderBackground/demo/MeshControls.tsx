// 色板、速度、扭曲与颗粒都实时生效；色板用 token 时切换主题会原地过渡到新色，不重建场景
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Field,
  Flex,
  Grid,
  Slider,
  Switch,
  ToggleGroup,
  ToggleItem,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { MeshGradient } from '@zerodep-dev/vue-tsx-pro-ui/three';
import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';

const PALETTES = {
  default: undefined,
  sunset: [colors.chart3, colors.chart4, colors.chart8, colors.warning],
  ocean: [colors.chart6, colors.chart2, colors.accent],
  forest: [colors.chart7, colors.chart2, colors.chart8],
  mono: [colors.accent, colors.accentSoft, colors.background],
};

const styles = css.create({
  stage: { height: '18rem', borderRadius: '_lg' },
});

export default _component(() => {
  let palette = _state<keyof typeof PALETTES>('default');
  let speed = _state(1);
  let distortion = _state(0.6);
  let grain = _state(0.04);
  let paused = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Field label="色板">
        <ToggleGroup _value={palette} required>
          <ToggleItem value="default">默认</ToggleItem>
          <ToggleItem value="sunset">日落</ToggleItem>
          <ToggleItem value="ocean">海洋</ToggleItem>
          <ToggleItem value="forest">森林</ToggleItem>
          <ToggleItem value="mono">单色</ToggleItem>
        </ToggleGroup>
      </Field>
      <Grid minItemWidth="10rem" gap="lg" align="end">
        <Field label="速度">
          <Slider _value={speed} min={0} max={4} step={0.1} />
        </Field>
        <Field label="扭曲">
          <Slider _value={distortion} min={0} max={1.5} step={0.05} />
        </Field>
        <Field label="颗粒">
          <Slider _value={grain} min={0} max={0.15} step={0.005} />
        </Field>
        <Switch _checked={paused}>暂停</Switch>
      </Grid>
      <MeshGradient
        sx={styles.stage}
        palette={PALETTES[palette]}
        speed={speed}
        distortion={distortion}
        grain={grain}
        paused={paused}
      />
    </Flex>
  );
});
