// 功能清单：图标代替圆点；ListItem 可以逐项换图标与颜色。size、spacing 调字号与间距
import { Check, Minus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, Grid, List, ListItem, Strong, Text } from '@vue-tsx-pro/ui';

const plans: [name: string, price: string, features: [string, boolean][]][] = [
  [
    '专业版',
    '¥39 / 月',
    [
      ['不限项目数', true],
      ['100 GB 存储', true],
      ['版本历史 30 天', true],
      ['单点登录', false],
    ],
  ],
  [
    '团队版',
    '¥99 / 人 / 月',
    [
      ['专业版的全部功能', true],
      ['共享空间与权限', true],
      ['版本历史 1 年', true],
      ['单点登录', true],
    ],
  ],
];

export default _component(() => () => (
  <Grid minItemWidth="14rem" gap="md">
    {plans.map(([name, price, features]) => (
      <Card key={name}>
        <Flex direction="column" gap="md">
          <Flex direction="column">
            <Strong size="lg">{name}</Strong>
            <Text tone="muted" size="sm">
              {price}
            </Text>
          </Flex>
          <List icon={Check} propsIcon={{ tone: 'success' }} gap="sm" size="sm">
            {features.map(([feature, included]) => (
              <ListItem
                key={feature}
                icon={included ? undefined : Minus}
                propsIcon={included ? undefined : { tone: 'muted' }}
              >
                <Text tone={included ? undefined : 'muted'}>{feature}</Text>
              </ListItem>
            ))}
          </List>
        </Flex>
      </Card>
    ))}
  </Grid>
));
