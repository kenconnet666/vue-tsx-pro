import { Cpu, Gauge, Layers, Lock, Rocket, Sparkles } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, Grid, H3, Icon, Paragraph, SpotlightCard } from '@vue-tsx-pro/ui';

const FEATURES = [
  { icon: Rocket, title: '开箱即用', text: '一行 createUi 配好主题、语言与路由。' },
  { icon: Gauge, title: '性能优先', text: '虚拟滚动、按需渲染，大表格也流畅。' },
  { icon: Layers, title: '可组合', text: '每个内部节点都开放部件属性。' },
  { icon: Lock, title: '无障碍', text: '按 WAI-ARIA 实现角色、状态与键盘操作。' },
  { icon: Sparkles, title: '主题', text: '所有外观取 token，切换主题实时变化。' },
  { icon: Cpu, title: '类型完整', text: '符文写法，TypeScript 完整理解双向绑定。' },
];

const styles = stylex.create({
  card: { height: '100%' },
  icon: { color: '_accentText', fontSize: '1.5rem' },
  text: { color: '_textMuted' },
});

export default _component(() => () => (
  <Grid minItemWidth="14rem" gap="md">
    {FEATURES.map((feature) => (
      <SpotlightCard key={feature.title}>
        <Card sx={styles.card}>
          <Flex direction="column" gap="sm">
            <Icon icon={feature.icon} sx={styles.icon} />
            <H3 size="lg">{feature.title}</H3>
            <Paragraph size="sm" sx={styles.text}>
              {feature.text}
            </Paragraph>
          </Flex>
        </Card>
      </SpotlightCard>
    ))}
  </Grid>
));
