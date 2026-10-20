/** 首页：一句话介绍（背后是粒子星座）、两个入口、几个特点，和一段能直接运行的代码 */
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
import { defineAsyncComponent, h } from 'vue';
import { EditInPlayground } from '../site/EditInPlayground';

// 标题后面的粒子星座：three 体积大，异步加载，加载完之前只有光晕，不挡首屏
const Particles = defineAsyncComponent(() =>
  import('@vue-tsx-pro/ui/three').then((module) => module.ParticleField),
);

const styles = stylex.create({
  // 标题后面一团很淡的品牌色光晕：亮色、暗色、纸张都取各自的浅品牌色
  hero: {
    position: 'relative',
    isolation: 'isolate',
    paddingBlock: '3rem',
    textAlign: 'center',
    '::before': {
      content: '""',
      position: 'absolute',
      zIndex: -1,
      insetInline: '10%',
      insetBlock: 0,
      backgroundImage: 'radial-gradient(closest-side, _colors.accentSoft, transparent)',
      filter: 'blur(24px)',
    },
  },
  // 粒子铺满标题区、四周淡出，压在光晕下面
  particles: {
    position: 'absolute',
    inset: 0,
    zIndex: -2,
    maskImage: 'radial-gradient(closest-side, black 55%, transparent)',
  },
  // 标题从正文色渐变到品牌色；不支持 background-clip: text 的浏览器退回正文色
  title: {
    fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
    letterSpacing: '_tighter',
    backgroundImage: 'linear-gradient(120deg, _colors.text 30%, _colors.accentText)',
    backgroundClip: 'text',
    color: 'transparent',
  },
  lead: { maxWidth: '36rem', marginInline: 'auto', fontSize: '_lg', lineHeight: '_relaxed' },
  // 特点卡片：悬停时轻轻浮起
  feature: {
    height: '_full',
    transition:
      'transform _durations.md _easings.standard, box-shadow _durations.md _easings.standard, border-color _durations.md _easings.standard',
    transform: { default: 'none', ':hover': 'translateY(-2px)' },
    boxShadow: { default: 'none', ':hover': '_md' },
    borderColor: { default: null, ':hover': '_borderStrong' },
  },
  // 图标放在浅品牌色的圆角方块里
  featureIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '_lg',
    backgroundColor: '_accentSoft',
    color: '_accentText',
  },
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
        <Particles links count={70} linkDistance={140} speed={0.6} sx={styles.particles} />
        <H1 sx={styles.title}>更自然的 Vue TSX</H1>
        <Paragraph tone="muted" sx={styles.lead}>
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
          <Card key={feature.title} variant="outline" sx={styles.feature}>
            <Flex direction="column" gap="sm">
              <span {...stylex.attrs(styles.featureIcon)}>
                <Icon icon={feature.icon} size="xl" />
              </span>
              <H2 size="lg">{feature.title}</H2>
              <Paragraph tone="muted">{feature.text}</Paragraph>
            </Flex>
          </Card>
        ))}
      </Grid>
      <CodePreview
        code={Counter.source}
        showCode
        align="center"
        actions={<EditInPlayground code={Counter.source} />}
      >
        {h(Counter.component)}
      </CodePreview>
    </Flex>
  </Container>
));
