import { Check } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Badge, Button, Card, Flex, Grid, H3, Icon, Text, TiltCard } from '@vue-tsx-pro/ui';

const PLANS = [
  { name: '入门', price: '¥0', features: ['3 个项目', '社区支持', '基础统计'] },
  {
    name: '专业',
    price: '¥99',
    features: ['不限项目', '优先支持', '高级统计', '团队协作'],
    featured: true,
  },
  { name: '企业', price: '联系我们', features: ['私有部署', '专属顾问', '审计日志'] },
];

const styles = stylex.create({
  card: { height: '100%' },
  price: { fontSize: '_xxl', fontWeight: '_bold' },
  feature: { color: '_textMuted' },
  check: { color: '_successText' },
});

export default _component(() => () => (
  <Grid minItemWidth="13rem" gap="lg">
    {PLANS.map((plan) => (
      <TiltCard key={plan.name} maxTilt={plan.featured ? 12 : 8}>
        <Card variant={plan.featured ? 'elevated' : 'surface'} sx={styles.card}>
          <Flex direction="column" gap="md">
            <Flex justify="between" align="center">
              <H3 size="lg">{plan.name}</H3>
              {plan.featured && <Badge>推荐</Badge>}
            </Flex>
            <Text sx={styles.price}>{plan.price}</Text>
            <Flex direction="column" gap="xs">
              {plan.features.map((feature) => (
                <Flex key={feature} gap="xs" align="center">
                  <Icon icon={Check} sx={styles.check} />
                  <Text size="sm" sx={styles.feature}>
                    {feature}
                  </Text>
                </Flex>
              ))}
            </Flex>
            <Button variant={plan.featured ? 'solid' : 'outline'}>选择{plan.name}</Button>
          </Flex>
        </Card>
      </TiltCard>
    ))}
  </Grid>
));
