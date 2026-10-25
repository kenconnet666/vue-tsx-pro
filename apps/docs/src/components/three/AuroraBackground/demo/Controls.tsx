import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Flex, Grid, Slider, Text, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';
import { AURORA_PALETTE, AuroraBackground } from '@vue-tsx-pro/ui/three';
import { colors } from '@vue-tsx-pro/ui/tokens';

const PALETTES = {
  default: AURORA_PALETTE,
  warm: [colors.chart3, colors.chart4, colors.chart8],
  brand: [colors.accent, colors.accentSoft, colors.chart5],
};

const styles = css.create({
  stage: { height: '18rem' },
  label: { minWidth: '4em', color: '_textMuted' },
  slider: { flexGrow: 1 },
});

export default _component(() => {
  let intensity = _state(1);
  let height = _state(0.55);
  let speed = _state(1);
  let palette = _state<keyof typeof PALETTES>('default');
  return () => (
    <Flex direction="column" gap="md">
      <ToggleGroup _value={_bind(palette)} required aria-label="色板">
        <ToggleItem value="default">极光</ToggleItem>
        <ToggleItem value="warm">晚霞</ToggleItem>
        <ToggleItem value="brand">品牌色</ToggleItem>
      </ToggleGroup>
      <Grid minItemWidth="14rem" gap="md">
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            亮度
          </Text>
          <Slider
            _value={_bind(intensity)}
            min={0}
            max={1.5}
            step={0.05}
            aria-label="亮度"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            高度
          </Text>
          <Slider
            _value={_bind(height)}
            min={0.1}
            max={0.9}
            step={0.01}
            aria-label="高度"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            速度
          </Text>
          <Slider
            _value={_bind(speed)}
            min={0}
            max={4}
            step={0.1}
            aria-label="速度"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
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
