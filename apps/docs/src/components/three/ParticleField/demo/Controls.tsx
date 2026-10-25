import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Flex, Grid, Slider, Switch, Text } from '@vue-tsx-pro/ui';
import { ParticleField } from '@vue-tsx-pro/ui/three';

const styles = css.create({
  stage: { height: '20rem' },
  label: { minWidth: '4em', color: '_textMuted' },
  slider: { flexGrow: 1 },
});

export default _component(() => {
  let count = _state(160);
  let size = _state(3);
  let linkDistance = _state(120);
  let speed = _state(1);
  let links = _state(true);
  let interactive = _state(true);
  let repelRadius = _state(140);
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="14rem" gap="md">
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            粒子数
          </Text>
          <Slider
            _value={count}
            min={20}
            max={400}
            step={10}
            aria-label="粒子数"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            大小
          </Text>
          <Slider
            _value={size}
            min={1}
            max={8}
            step={0.5}
            aria-label="大小"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            连线距离
          </Text>
          <Slider
            _value={linkDistance}
            min={40}
            max={200}
            step={5}
            aria-label="连线距离"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            速度
          </Text>
          <Slider
            _value={speed}
            min={0}
            max={4}
            step={0.1}
            aria-label="速度"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            排开半径
          </Text>
          <Slider
            _value={repelRadius}
            min={40}
            max={300}
            step={10}
            disabled={!interactive}
            aria-label="排开半径"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="lg" align="center">
          <Switch _checked={links}>连线</Switch>
          <Switch _checked={interactive}>指针排开</Switch>
        </Flex>
      </Grid>
      <Card padding="none">
        <ParticleField
          sx={styles.stage}
          count={count}
          size={size}
          links={links}
          linkDistance={linkDistance}
          speed={speed}
          interactive={interactive}
          repelRadius={repelRadius}
        />
      </Card>
    </Flex>
  );
});
