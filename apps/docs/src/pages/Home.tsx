/** 首页：一句话介绍、两个入口、几个特点，和一段能直接运行的代码 */
import { ArrowRight, Palette, Sparkles, Zap } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Card,
  Container,
  CodePreview,
  Flex,
  Grid,
  H1,
  H2,
  Icon,
  LinkButton,
  Paragraph,
  type IconData,
} from '@vue-tsx-pro/ui';
import Counter from './demo/Counter.tsx?demo';
import { h } from 'vue';

const styles = stylex.create({
  hero: { paddingBlock: '_xl', textAlign: 'center' },
  title: { fontSize: 'clamp(2rem, 5vw, 3.25rem)' },
  lead: { maxWidth: '36rem', marginInline: 'auto' },
  feature: { color: '_accentText' },
});

const features: { icon: IconData; title: string; text: string }[] = [
  {
    icon: Sparkles,
    title: '下划线符文',
    text: '_state、_derived、_effect：像写普通变量一样写响应式，编译成 Vue 3.5 的 ref 与 computed。',
  },
  {
    icon: Zap,
    title: '只更新该更新的',
    text: '编译器为插槽与回调做缓存，props 按需追踪；虚拟滚动的表格滚动每步几毫秒。',
  },
  {
    icon: Palette,
    title: 'StyleX 与三套主题',
    text: '原子化 CSS、类型安全的 token；亮色、暗色、纸张三套主题，对比度逐对检查。',
  },
];

export default _component(() => () => (
  <Container size="lg" padding="none">
    <Flex direction="column" gap="xl">
      <Flex direction="column" gap="lg" align="center" sx={styles.hero}>
        <H1 sx={styles.title}>更自然的 Vue TSX</H1>
        <Paragraph size="lg" tone="muted" sx={styles.lead}>
          props 驱动的组件、下划线符文与 StyleX，加上一套按无障碍规范写的组件库。在已有的 Vue
          项目里直接用。
        </Paragraph>
        <Flex gap="sm" wrap justify="center">
          <LinkButton href="/guide/getting-started" iconEnd={ArrowRight}>
            快速开始
          </LinkButton>
          <LinkButton href="/components/button" variant="soft">
            浏览组件
          </LinkButton>
        </Flex>
      </Flex>
      <Grid minItemWidth="16rem" gap="md">
        {features.map((feature) => (
          <Card key={feature.title} variant="outline">
            <Flex direction="column" gap="sm">
              <Icon icon={feature.icon} size="xl" sx={styles.feature} />
              <H2 size="lg">{feature.title}</H2>
              <Paragraph tone="muted">{feature.text}</Paragraph>
            </Flex>
          </Card>
        ))}
      </Grid>
      <CodePreview code={Counter.source} showCode align="center">
        {h(Counter.component)}
      </CodePreview>
    </Flex>
  </Container>
));
