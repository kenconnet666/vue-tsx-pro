import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, Grid, Slider, Switch, Text } from '@vue-tsx-pro/ui';
import { ParticleField } from '@vue-tsx-pro/ui/three';

const styles = stylex.create({
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
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="14rem" gap="md">
        <Flex gap="sm" align="center">
          <Text size="sm" sx={styles.label}>
            粒子数
          </Text>
          <Slider
            value={_bind(count)}
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
            value={_bind(size)}
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
            value={_bind(linkDistance)}
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
            value={_bind(speed)}
            min={0}
            max={4}
            step={0.1}
            aria-label="速度"
            propsRoot={{ sx: styles.slider }}
          />
        </Flex>
        <Flex gap="lg" align="center">
          <Switch checked={_bind(links)}>连线</Switch>
          <Switch checked={_bind(interactive)}>指针排开</Switch>
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
        />
      </Card>
    </Flex>
  );
});
