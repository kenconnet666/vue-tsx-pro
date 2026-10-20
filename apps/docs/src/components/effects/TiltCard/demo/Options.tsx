import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, Grid, Slider, Switch, Text, TiltCard } from '@vue-tsx-pro/ui';

const styles = stylex.create({
  label: { minWidth: '5em', color: '_textMuted' },
  slider: { flexGrow: 1 },
  cover: {
    height: '12rem',
    display: 'grid',
    placeItems: 'center',
    backgroundImage: 'linear-gradient(135deg, _colors.chart5, _colors.accent, _colors.chart6)',
    color: '_accentContrast',
    fontSize: '_xl',
    fontWeight: '_bold',
  },
});

export default _component(() => {
  let maxTilt = _state(12);
  let scale = _state(1.04);
  let glare = _state(true);
  let disabled = _state(false);
  return () => (
    <Flex direction="column" gap="lg">
      <Grid minItemWidth="14rem" gap="md">
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            倾斜 {maxTilt}°
          </Text>
          <Slider
            value={_bind(maxTilt)}
            min={0}
            max={30}
            aria-label="最大倾斜角度"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            放大 {scale}
          </Text>
          <Slider
            value={_bind(scale)}
            min={1}
            max={1.15}
            step={0.01}
            aria-label="悬停时的放大倍数"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="lg" align="center">
          <Switch checked={_bind(glare)}>高光</Switch>
          <Switch checked={_bind(disabled)}>禁用</Switch>
        </Flex>
      </Grid>
      <Grid minItemWidth="14rem" gap="lg">
        {['极光', '星云', '潮汐'].map((title) => (
          <TiltCard key={title} maxTilt={maxTilt} scale={scale} glare={glare} disabled={disabled}>
            <Card padding="none">
              <div {...stylex.attrs(styles.cover)}>{title}</div>
            </Card>
          </TiltCard>
        ))}
      </Grid>
    </Flex>
  );
});
