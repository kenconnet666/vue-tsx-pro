// 属性都实时生效；links 与 palette 变了会重建场景
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Field, Flex, Grid, Slider, Switch } from '@zerodep-dev/vue-tsx-pro-ui';
import { ParticleField } from '@zerodep-dev/vue-tsx-pro-ui/three';

const styles = css.create({
  stage: { height: '20rem' },
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
      <Flex gap="lg" wrap>
        <Switch _checked={links}>连线</Switch>
        <Switch _checked={interactive}>指针排开</Switch>
      </Flex>
      <Grid minItemWidth="10rem" gap="lg">
        <Field label="粒子数">
          <Slider _value={count} min={20} max={400} step={10} />
        </Field>
        <Field label="大小">
          <Slider _value={size} min={1} max={8} step={0.5} />
        </Field>
        <Field label="速度">
          <Slider _value={speed} min={0} max={4} step={0.1} />
        </Field>
        <Field label="连线距离" disabled={!links}>
          <Slider _value={linkDistance} min={40} max={200} step={5} />
        </Field>
        <Field label="排开半径" disabled={!interactive}>
          <Slider _value={repelRadius} min={40} max={300} step={10} />
        </Field>
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
