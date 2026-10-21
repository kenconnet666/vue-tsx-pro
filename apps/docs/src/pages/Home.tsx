/**
 * 首页：介绍与导航。站点导航是默认收起的抽屉，首页就是入口：
 * 一句话介绍（背后是粒子星座）与两个入口；从这里开始（指南）；降本管理案例（整页示例）；组件目录（按分类、带数量）；
 * 最后是几个特点和一段能直接运行的代码。目录与侧栏、搜索同一份数据（site/nav），新增页面自动出现
 */
import {
  ArrowRight,
  BookOpen,
  Code2,
  Palette,
  Plane,
  Sparkles,
  SwatchBook,
  Zap,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Badge,
  Card,
  CodePreview,
  Container,
  Flex,
  Grid,
  H1,
  H2,
  H3,
  Icon,
  Link,
  LinkButton,
  Paragraph,
  Small,
  Text,
  type IconData,
} from '@vue-tsx-pro/ui';
import Counter from './demo/Counter.tsx?demo';
import { defineAsyncComponent, h } from 'vue';
import { EditInPlayground } from '../site/EditInPlayground';
import { sections, type NavPage } from '../site/nav';

// 标题后面的粒子星座：three 体积大，异步加载，加载完之前只有光晕，不挡首屏
const Particles = defineAsyncComponent(() =>
  import('@vue-tsx-pro/ui/three').then((module) => module.ParticleField),
);

const styles = stylex.create({
  // 标题后面一团很淡的品牌色光晕：亮色、暗色、纸张都取各自的浅品牌色
  hero: {
    position: 'relative',
    isolation: 'isolate',
    paddingBlock: '2rem',
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
    fontSize: 'clamp(2.25rem, 5vw, 3.25rem)',
    letterSpacing: '_tighter',
    backgroundImage: 'linear-gradient(120deg, _colors.text 30%, _colors.accentText)',
    backgroundClip: 'text',
    color: 'transparent',
  },
  lead: { maxWidth: '40rem', marginInline: 'auto', fontSize: '_lg', lineHeight: '_relaxed' },
  // 各块之间比块里松一档：一眼分得出几块
  page: { rowGap: '2.5rem' },
  section: { display: 'flex', flexDirection: 'column', gap: '_md' },
  sectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '_md',
  },
  // 入口卡片：整张可点（标题链接盖住卡片），悬停时轻轻浮起
  entry: {
    position: 'relative',
    height: '_full',
    transition:
      'transform _durations.md _easings.standard, box-shadow _durations.md _easings.standard, border-color _durations.md _easings.standard',
    transform: { default: 'none', ':hover': 'translateY(-2px)' },
    boxShadow: { default: 'none', ':hover': '_md' },
    borderColor: { default: null, ':hover': '_borderStrong' },
  },
  entryLink: {
    color: '_text',
    textDecoration: 'none',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
  // 图标放在浅品牌色的圆角方块里
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '_lg',
    backgroundColor: '_accentSoft',
    color: '_accentText',
  },
  // 组件目录：多列流式排布，每类一张卡按自己的高度往下排（同一行不拉成一样高，少的那类不留空白）；
  // 组件名两列排，英文名在前、中文名淡一些
  directory: { columnWidth: '20rem', columnGap: '_md' },
  category: { breakInside: 'avoid', marginBlockEnd: '_md' },
  pageList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))',
    columnGap: '_md',
    rowGap: '_xs',
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  pageLink: { display: 'inline-flex', alignItems: 'baseline', gap: '_xs', minWidth: 0 },
});

/** “Button 按钮” → 英文名与中文名 */
function splitTitle(title: string): { name: string; label: string } {
  const space = title.indexOf(' ');
  return space < 0
    ? { name: title, label: '' }
    : { name: title.slice(0, space), label: title.slice(space + 1) };
}

const guideIcons: IconData[] = [BookOpen, SwatchBook, Code2];
const guide = sections.find((section) => section.label === '指南')?.pages ?? [];
const cases = sections.find((section) => section.label === '案例')?.pages ?? [];
const components = sections.filter(
  (section) => section.label !== '指南' && section.label !== '案例',
);
const componentCount = components.reduce((total, section) => total + section.pages.length, 0);

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
    title: 'StyleX 与多套主题',
    text: '原子化 CSS、类型安全的 token；亮色、暗色、纸张等主题，对比度逐对检查。',
  },
];

/** 一张入口卡：图标、标题（链接，整张可点）、说明 */
function entry(page: NavPage, icon: IconData) {
  return (
    <Card key={page.path} variant="outline" sx={styles.entry}>
      <Flex gap="md" align="start">
        <span {...stylex.attrs(styles.icon)}>
          <Icon icon={icon} size="lg" />
        </span>
        <Flex direction="column" gap="xs">
          <H3 size="md">
            <a href={page.path} {...stylex.attrs(styles.entryLink)}>
              {page.title}
            </a>
          </H3>
          <Small tone="muted">{page.description}</Small>
        </Flex>
      </Flex>
    </Card>
  );
}

export default _component(() => () => (
  <Container size="xl" padding="none">
    <Flex direction="column" gap="xl" sx={styles.page}>
      <Flex direction="column" gap="lg" align="center" sx={styles.hero}>
        <Particles links count={70} linkDistance={140} speed={0.6} sx={styles.particles} />
        <H1 sx={styles.title}>更自然的 Vue TSX</H1>
        <Paragraph tone="muted" sx={styles.lead}>
          props 驱动的组件、下划线符文与 StyleX，加上一套按无障碍规范写的组件库（{componentCount}{' '}
          个组件页）与整页的业务案例。在已有的 Vue 项目里直接用。
        </Paragraph>
        <Flex gap="sm" wrap justify="center">
          <LinkButton href="/guide/getting-started" iconEnd={ArrowRight}>
            快速开始
          </LinkButton>
          <LinkButton href={cases[0]?.path ?? '/components/button'} variant="soft" icon={Plane}>
            看降本管理案例
          </LinkButton>
        </Flex>
      </Flex>

      <section {...stylex.attrs(styles.section)} aria-labelledby="home-start">
        <H2 id="home-start" size="lg">
          从这里开始
        </H2>
        <Grid minItemWidth="18rem" gap="md">
          {guide.map((page, index) => entry(page, guideIcons[index] ?? BookOpen))}
        </Grid>
      </section>

      {cases.length > 0 && (
        <section {...stylex.attrs(styles.section)} aria-labelledby="home-cases">
          <div {...stylex.attrs(styles.sectionHead)}>
            <H2 id="home-cases" size="lg">
              案例 · 联合降本管理
            </H2>
            <Small tone="muted">按需求文档与降本项目信息表做的整页示例，数据是虚构的</Small>
          </div>
          <Grid minItemWidth="18rem" gap="md">
            {cases.map((page) => entry(page, Plane))}
          </Grid>
        </section>
      )}

      <section {...stylex.attrs(styles.section)} aria-labelledby="home-components">
        <div {...stylex.attrs(styles.sectionHead)}>
          <H2 id="home-components" size="lg">
            组件目录
          </H2>
          <Small tone="muted">
            {components.length} 类、{componentCount} 个组件页；顶栏的搜索（Ctrl + K）可以直接跳
          </Small>
        </div>
        <div {...stylex.attrs(styles.directory)}>
          {components.map((section) => (
            <Card key={section.label} variant="outline" sx={styles.category}>
              <Flex direction="column" gap="sm">
                <Flex align="center" gap="sm">
                  <Text weight="semibold">{section.label}</Text>
                  <Badge radius="full">{section.pages.length}</Badge>
                </Flex>
                <ul {...stylex.attrs(styles.pageList)}>
                  {section.pages.map((page) => {
                    const { name, label } = splitTitle(page.title);
                    return (
                      <li key={page.path}>
                        <Link href={page.path} title={page.description} sx={styles.pageLink}>
                          {name}
                          <Small tone="muted">{label}</Small>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Flex>
            </Card>
          ))}
        </div>
      </section>

      <Grid minItemWidth="16rem" gap="md">
        {features.map((feature) => (
          <Card key={feature.title} variant="outline">
            <Flex gap="md" align="start">
              <span {...stylex.attrs(styles.icon)}>
                <Icon icon={feature.icon} size="lg" />
              </span>
              <Flex direction="column" gap="xs">
                <H3 size="md">{feature.title}</H3>
                <Small tone="muted">{feature.text}</Small>
              </Flex>
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
