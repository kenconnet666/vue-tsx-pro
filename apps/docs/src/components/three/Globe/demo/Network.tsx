// 全球节点：各地的机房标注成光圈，上海到各地的专线画成弧线，旁边列出节点与延迟
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Badge, Card, Flex, Grid, H3, Small, Text } from '@zerodep-dev/vue-tsx-pro-ui';
import { Globe, type GlobeArc, type GlobeMarker } from '@zerodep-dev/vue-tsx-pro-ui/three';

const nodes = [
  { city: '上海', lat: 31.23, lng: 121.47, latency: 0 },
  { city: '新加坡', lat: 1.35, lng: 103.82, latency: 38 },
  { city: '法兰克福', lat: 50.11, lng: 8.68, latency: 186 },
  { city: '弗吉尼亚', lat: 38.03, lng: -78.48, latency: 212 },
  { city: '圣保罗', lat: -23.55, lng: -46.63, latency: 318 },
  { city: '悉尼', lat: -33.87, lng: 151.21, latency: 129 },
  { city: '东京', lat: 35.68, lng: 139.69, latency: 32 },
];

const markers: GlobeMarker[] = nodes.map(({ lat, lng }, index) => ({
  lat,
  lng,
  size: index === 0 ? 1.4 : 1,
}));
const arcs: GlobeArc[] = nodes
  .slice(1)
  .map(({ lat, lng }) => ({ from: [nodes[0]!.lat, nodes[0]!.lng], to: [lat, lng] }));

const styles = css.create({
  globe: { maxWidth: '28rem', marginInline: 'auto' },
});

export default _component(() => () => (
  <Grid minItemWidth="18rem" gap="lg" align="center">
    <Globe markers={markers} arcs={arcs} center={{ lat: 25, lng: 115 }} sx={styles.globe} />
    <Card padding="md">
      <Flex direction="column" gap="sm">
        <H3 size="md">全球节点</H3>
        {nodes.map((node) => (
          <Flex key={node.city} align="center" justify="between" gap="md">
            <Text>{node.city}</Text>
            {node.latency === 0 ? (
              <Badge tone="accent">主节点</Badge>
            ) : (
              <Small tone="muted">{node.latency} ms</Small>
            )}
          </Flex>
        ))}
      </Flex>
    </Card>
  </Grid>
));
