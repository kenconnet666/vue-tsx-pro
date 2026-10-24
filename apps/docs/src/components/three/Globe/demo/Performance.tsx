// 画质（陆地点数随它缩放）与暂停；off 时显示 fallback；子元素叠在地球上（这里是底部的说明）
import { Globe as GlobeIcon } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Badge, Field, Flex, Grid, Icon, Switch, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';
import { Globe, type ThreeQuality } from '@vue-tsx-pro/ui/three';

const styles = css.create({
  globe: { maxWidth: '18rem', marginInline: 'auto', display: 'flex', alignItems: 'flex-end' },
  content: { width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: '_sm' },
  fallback: {
    display: 'grid',
    placeItems: 'center',
    height: '100%',
    color: '_textMuted',
  },
  fallbackIcon: { width: '45%', height: '45%', strokeWidth: 0.75 },
});

const sites = [
  { lat: 39.9, lng: 116.4 },
  { lat: 1.35, lng: 103.8 },
  { lat: 50.1, lng: 8.7 },
  { lat: 37.4, lng: -122.1 },
];

export default _component(() => {
  let quality = _state<ThreeQuality>('auto');
  let paused = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="12rem" gap="lg" align="end">
        <Field label="画质">
          <ToggleGroup value={_bind(quality)} required>
            <ToggleItem value="auto">自动</ToggleItem>
            <ToggleItem value="low">低</ToggleItem>
            <ToggleItem value="high">高</ToggleItem>
            <ToggleItem value="off">关</ToggleItem>
          </ToggleGroup>
        </Field>
        <Switch checked={_bind(paused)}>暂停</Switch>
      </Grid>
      <Globe
        sx={styles.globe}
        markers={sites}
        quality={quality}
        paused={paused}
        fallback={
          <div {...css.attrs(styles.fallback)}>
            <Icon icon={GlobeIcon} sx={styles.fallbackIcon} />
          </div>
        }
        propsContent={{ sx: styles.content }}
      >
        <Badge variant="soft">{sites.length} 个数据中心</Badge>
      </Globe>
    </Flex>
  );
});
