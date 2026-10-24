// 多角度展示：orbit 定起始角度，controls 关掉拖动与方向键；缩略图用低画质、降分辨率，paused 停住自转
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Flex, Grid, Small, Switch } from '@vue-tsx-pro/ui';
import { ModelViewer } from '@vue-tsx-pro/ui/three';

const styles = css.create({
  viewer: { maxWidth: '12rem', marginInline: 'auto' },
  fallback: {
    display: 'grid',
    placeItems: 'center',
    height: '100%',
    color: '_textMuted',
    fontSize: '_sm',
  },
});

const views = [
  { label: '俯视', orbit: { yaw: 30, pitch: 50 } },
  { label: '平视', orbit: { yaw: 0, pitch: 0 } },
  { label: '仰视', orbit: { yaw: -30, pitch: -25 } },
];

export default _component(() => {
  let paused = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Switch checked={_bind(paused)}>暂停自转</Switch>
      <Grid minItemWidth="10rem" gap="md">
        {views.map((view) => (
          <Card key={view.label} padding="sm">
            <Flex direction="column" gap="xs" align="center">
              <ModelViewer
                src="/models/trophy.glb"
                alt={`奖杯，${view.label}`}
                orbit={view.orbit}
                controls={false}
                paused={paused}
                quality="low"
                resolution={0.75}
                fallback={<div {...css.attrs(styles.fallback)}>预览不可用</div>}
                sx={styles.viewer}
              />
              <Small tone="muted">{view.label}</Small>
            </Flex>
          </Card>
        ))}
      </Grid>
    </Flex>
  );
});
