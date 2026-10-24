import { Cloud, Coffee, Gem, Leaf, Mountain, Rocket, Waves, Zap } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Badge, Flex, Icon, Marquee, Text } from '@vue-tsx-pro/ui';

const partners = [
  { icon: Cloud, name: '云杉科技' },
  { icon: Rocket, name: '星舰物流' },
  { icon: Leaf, name: '青禾农业' },
  { icon: Mountain, name: '远山户外' },
  { icon: Waves, name: '潮汐传媒' },
  { icon: Zap, name: '闪电支付' },
  { icon: Gem, name: '晶石珠宝' },
  { icon: Coffee, name: '拾光咖啡' },
];

const tags = [
  '组件库',
  '主题定制',
  '无障碍',
  '虚拟滚动',
  'StyleX',
  'TSX',
  '日期组件',
  '3D 效果',
  '表单校验',
  '图表',
];

const styles = stylex.create({
  partner: { color: '_textMuted', fontSize: '_lg', whiteSpace: 'nowrap' },
});

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Marquee fade gap="xl" aria-label="合作伙伴">
      {partners.map((partner) => (
        <Flex key={partner.name} align="center" gap="sm" sx={styles.partner}>
          <Icon icon={partner.icon} />
          <Text weight="semibold">{partner.name}</Text>
        </Flex>
      ))}
    </Marquee>
    <Marquee fade direction="right" speed={25} gap="sm" aria-label="特性">
      {tags.map((tag) => (
        <Badge key={tag} variant="soft" radius="full">
          {tag}
        </Badge>
      ))}
    </Marquee>
  </Flex>
));
