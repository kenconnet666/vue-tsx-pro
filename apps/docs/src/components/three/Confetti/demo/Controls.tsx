// 只在一块区域里放（fullscreen={false}）：方向、散开角度、数量、初速度与重力实时调整
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Button, Card, Flex, Grid, Slider, Text } from '@vue-tsx-pro/ui';
import { Confetti } from '@vue-tsx-pro/ui/three';

const styles = css.create({
  stage: {
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: '20rem',
    paddingBottom: '_lg',
    overflow: 'hidden',
  },
  label: { minWidth: '5em', color: '_textMuted' },
  slider: { flexGrow: 1 },
});

export default _component(() => {
  let angle = _state(90);
  let spread = _state(70);
  let count = _state(160);
  let velocity = _state(0.8);
  let gravity = _state(1);
  let fired = _state(0);
  const sliders = [
    {
      label: '方向（度）',
      min: 0,
      max: 180,
      step: 5,
      get: () => angle,
      set: (v: number) => (angle = v),
    },
    {
      label: '散开（度）',
      min: 10,
      max: 180,
      step: 5,
      get: () => spread,
      set: (v: number) => (spread = v),
    },
    {
      label: '数量',
      min: 20,
      max: 400,
      step: 20,
      get: () => count,
      set: (v: number) => (count = v),
    },
    {
      label: '初速度',
      min: 0.3,
      max: 1.5,
      step: 0.1,
      get: () => velocity,
      set: (v: number) => (velocity = v),
    },
    {
      label: '重力',
      min: 0.2,
      max: 2,
      step: 0.1,
      get: () => gravity,
      set: (v: number) => (gravity = v),
    },
  ];
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="14rem" gap="md">
        {sliders.map((item) => (
          <Flex key={item.label} gap="sm" align="center">
            <Text size="sm" sx={styles.label}>
              {item.label}
            </Text>
            <Slider
              _value={_bind(() => item.get(), item.set)}
              min={item.min}
              max={item.max}
              step={item.step}
              aria-label={item.label}
              propsRoot={{ sx: styles.slider }}
            />
          </Flex>
        ))}
      </Grid>
      <Card padding="none">
        <div {...css.attrs(styles.stage)}>
          <Confetti
            fullscreen={false}
            trigger={fired}
            origin={{ x: 0.5, y: 0.85 }}
            angle={angle}
            spread={spread}
            count={count}
            velocity={velocity}
            gravity={gravity}
          />
          <Button onClick={() => fired++}>放一次</Button>
        </div>
      </Card>
    </Flex>
  );
});
