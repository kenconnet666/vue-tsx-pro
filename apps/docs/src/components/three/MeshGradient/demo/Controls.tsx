import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Flex, Grid, Slider, Switch, Text } from '@vue-tsx-pro/ui';
import { MeshGradient } from '@vue-tsx-pro/ui/three';

const styles = css.create({
  stage: { height: '18rem', borderRadius: '_md' },
  label: { minWidth: '4em', color: '_textMuted' },
  slider: { flexGrow: 1 },
});

export default _component(() => {
  let speed = _state(1);
  let distortion = _state(0.6);
  let grain = _state(0.04);
  let paused = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="14rem" gap="md">
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
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            扭曲
          </Text>
          <Slider
            _value={_bind(distortion)}
            min={0}
            max={1.5}
            step={0.05}
            aria-label="扭曲"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            颗粒
          </Text>
          <Slider
            _value={_bind(grain)}
            min={0}
            max={0.15}
            step={0.005}
            aria-label="颗粒"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Switch _checked={_bind(paused)}>暂停</Switch>
      </Grid>
      <MeshGradient
        sx={styles.stage}
        speed={speed}
        distortion={distortion}
        grain={grain}
        paused={paused}
      />
    </Flex>
  );
});
