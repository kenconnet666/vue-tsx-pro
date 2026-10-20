import { Armchair, BedDouble, Lamp, LampDesk, Sofa } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, GridList, Icon, Small, Strong, Text } from '@vue-tsx-pro/ui';

const products = [
  { icon: Sofa, name: '云朵三人沙发', price: 4299 },
  { icon: Armchair, name: '藤编单椅', price: 899 },
  { icon: BedDouble, name: '实木双人床', price: 3599 },
  { icon: Lamp, name: '黄铜落地灯', price: 659 },
  { icon: Armchair, name: '人体工学椅', price: 1999 },
  { icon: LampDesk, name: '护眼台灯', price: 329 },
];

const styles = stylex.create({
  cover: {
    display: 'grid',
    placeItems: 'center',
    height: '5rem',
    marginBlockEnd: '_sm',
    borderRadius: '_sm',
    backgroundColor: '_fill',
    color: '_textMuted',
    fontSize: '2rem',
  },
});

export default _component(() => () => (
  <GridList minItemWidth="9rem" gap="md" aria-label="热卖家具">
    {products.map((product) => (
      <li key={product.name}>
        <Card padding="sm">
          <div {...stylex.attrs(styles.cover)}>
            <Icon icon={product.icon} />
          </div>
          <Flex direction="column" gap="xs">
            <Text size="sm">{product.name}</Text>
            <Strong>
              ¥{product.price.toLocaleString()} <Small tone="muted">起</Small>
            </Strong>
          </Flex>
        </Card>
      </li>
    ))}
  </GridList>
));
