// 装饰效果：effect 给官网、活动页的卡片加一点动感。tilt 跟着指针倾斜、带高光；spotlight 一团光跟着指针、
// 靠近边框时点亮边框（并排的几张光会在它们之间传递）；beam 一段光沿边框循环流动，用来突出推荐的那一张
import { Gauge, Layers, Rocket } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Badge, Button, Card, Flex, Grid, Icon, Paragraph, Strong, Text } from '@vue-tsx-pro/ui';

const features = [
  { icon: Rocket, title: '开箱即用', text: '一行 createUi 配好主题、语言与路由。' },
  { icon: Gauge, title: '性能优先', text: '虚拟滚动、按需绘制，大表格也流畅。' },
  { icon: Layers, title: '可组合', text: '每个内部节点都开放部件属性。' },
];

const styles = stylex.create({
  icon: { color: '_accentText', fontSize: '1.25rem' },
  price: { fontSize: '1.75rem', fontWeight: '_semibold' },
});

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Grid minItemWidth="9rem" gap="sm">
      {features.map((feature) => (
        <Card key={feature.title} effect="spotlight" padding="md">
          <Flex direction="column" gap="xs">
            <Icon icon={feature.icon} sx={styles.icon} />
            <Strong>{feature.title}</Strong>
            <Paragraph size="sm" tone="muted">
              {feature.text}
            </Paragraph>
          </Flex>
        </Card>
      ))}
    </Grid>
    <Grid minItemWidth="12rem" gap="md">
      <Card
        effect="tilt"
        variant="elevated"
        header="团队版"
        footer={<Button variant="soft">试用</Button>}
      >
        <Text sx={styles.price}>¥99</Text>
        <Paragraph size="sm" tone="muted">
          每人每月；指针放上来，卡片朝它倾斜
        </Paragraph>
      </Card>
      <Card
        effect="beam"
        header="企业版"
        extra={<Badge tone="accent">推荐</Badge>}
        footer={<Button>联系销售</Button>}
      >
        <Text sx={styles.price}>¥299</Text>
        <Paragraph size="sm" tone="muted">
          每人每月；流光沿边框转圈，突出推荐的方案
        </Paragraph>
      </Card>
    </Grid>
  </Flex>
));
