// 这一块跟随站点的主题：暗色里是夜空的极光，亮色里是一层彩色的雾
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  Field,
  Flex,
  Grid,
  Slider,
  ToggleGroup,
  ToggleItem,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { AURORA_PALETTE, AuroraBackground } from '@zerodep-dev/vue-tsx-pro-ui/three';
import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';

const PALETTES = {
  default: AURORA_PALETTE,
  warm: [colors.chart3, colors.chart4, colors.chart8],
  brand: [colors.accent, colors.accentSoft, colors.chart5],
};

const styles = css.create({
  stage: { height: '18rem' },
});

export default _component(() => {
  let intensity = _state(1);
  let height = _state(0.55);
  let speed = _state(1);
  let palette = _state<keyof typeof PALETTES>('default');
  return () => (
    <Flex direction="column" gap="md">
      <Field label="色板">
        <ToggleGroup _value={palette} required>
          <ToggleItem value="default">极光</ToggleItem>
          <ToggleItem value="warm">晚霞</ToggleItem>
          <ToggleItem value="brand">品牌色</ToggleItem>
        </ToggleGroup>
      </Field>
      <Grid minItemWidth="10rem" gap="lg">
        <Field label="亮度">
          <Slider _value={intensity} min={0} max={1.5} step={0.05} />
        </Field>
        <Field label="高度">
          <Slider _value={height} min={0.1} max={0.9} step={0.01} />
        </Field>
        <Field label="速度">
          <Slider _value={speed} min={0} max={4} step={0.1} />
        </Field>
      </Grid>
      <Card padding="none">
        <AuroraBackground
          sx={styles.stage}
          palette={PALETTES[palette]}
          intensity={intensity}
          height={height}
          speed={speed}
        />
      </Card>
    </Flex>
  );
});
