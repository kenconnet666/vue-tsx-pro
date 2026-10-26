// 程序生成的对象：直接交给 object；金属度、粗糙度不同的材质在同一间摄影棚里；地址错了时显示提示
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Flex, Grid, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { ModelViewer } from '@zerodep-dev/vue-tsx-pro-ui/three';
import { IcosahedronGeometry, Mesh, MeshPhysicalMaterial, TorusKnotGeometry } from 'three';

const styles = css.create({
  viewer: { maxWidth: '16rem', marginInline: 'auto' },
});

const knot = new Mesh(
  new TorusKnotGeometry(1, 0.32, 220, 32),
  new MeshPhysicalMaterial({ color: 0x8b7cf6, metalness: 0.2, roughness: 0.25, clearcoat: 1 }),
);
const gem = new Mesh(
  new IcosahedronGeometry(1, 0),
  new MeshPhysicalMaterial({
    color: 0x5ed3c3,
    metalness: 0,
    roughness: 0.05,
    transmission: 0.6,
    thickness: 1,
  }),
);

const items = [
  { label: '清漆的环面结', render: () => <ModelViewer object={knot} sx={styles.viewer} /> },
  {
    label: '透光的二十面体，暗一些',
    render: () => (
      <ModelViewer object={gem} exposure={0.7} rotationSpeed={-30} sx={styles.viewer} />
    ),
  },
  {
    label: '地址错了',
    render: () => <ModelViewer src="/models/missing.glb" sx={styles.viewer} />,
  },
];

export default _component(() => () => (
  <Grid minItemWidth="14rem" gap="md">
    {items.map((item) => (
      <Card key={item.label} padding="sm">
        <Flex direction="column" gap="xs" align="center">
          {item.render()}
          <Small tone="muted">{item.label}</Small>
        </Flex>
      </Card>
    ))}
  </Grid>
));
