// 基础组件演示（文档站暂缓，先在这里按分类演示）：每加一批组件就加一节
import { ArrowRight, Settings, Star } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Code,
  Collapsible,
  Container,
  darkTheme,
  Flex,
  Grid,
  Heading,
  Icon,
  Kbd,
  lightTheme,
  Link,
  Provider,
  Separator,
  Text,
  themeTransition,
  VisuallyHidden,
} from '@vue-tsx-pro/ui';
import { animate } from 'animejs';
import type { VNodeChild } from 'vue';
import { Button } from '../pilot/Button';

const styles = stylex.create({
  page: {
    display: 'grid',
    alignContent: 'start',
    gap: '_xl',
    padding: '_xl',
    minHeight: '100vh',
    backgroundColor: '_background',
  },
  section: { display: 'grid', gap: '_md' },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '_md' },
  iconButton: {
    display: 'inline-flex',
    padding: '_sm',
    borderWidth: 0,
    backgroundColor: '_fill',
    color: '_text',
  },
  paragraph: { margin: 0, paddingBlock: '_sm' },
  narrow: { maxWidth: '20em' },
  card: { padding: '_md', borderRadius: '_md', backgroundColor: '_fill', color: '_text' },
  outlined: { borderWidth: '_xs', borderStyle: 'dashed', borderColor: '_border' },
  track: {
    // 小球的宽度加上移动的距离
    width: 'calc(_control + 120px)',
    padding: '_xs',
    borderRadius: '_full',
    backgroundColor: '_fill',
  },
  ball: {
    width: '_control',
    height: '_control',
    borderRadius: '_full',
    backgroundColor: '_accent',
  },
});

const Section = _component(
  ({ title, children }: { title: string; children?: VNodeChild }) =>
    () => (
      <section {...stylex.attrs(styles.section)}>
        <Heading level={2} size="lg">
          {title}
        </Heading>
        {children}
      </section>
    ),
);

export const Base = _component(() => {
  let dark = _state(false);
  let ball = _state.raw<HTMLElement | null>(null);
  let moved = false;

  // JS 动画：Anime.js 的 animate 加上主题的弹簧时长；减少动态效果时立即到位
  function move() {
    moved = !moved;
    animate(ball!, {
      x: moved ? 120 : 0,
      ...themeTransition(ball!, { duration: 'lg', bounce: 0.3 }),
    });
  }

  return () => (
    <Provider theme={dark ? darkTheme : lightTheme}>
      <main {...stylex.attrs(styles.page)}>
        <div {...stylex.attrs(styles.row)}>
          <Button variant="outline" class="toggle-theme" onClick={() => (dark = !dark)}>
            {dark ? '亮色' : '暗色'}
          </Button>
        </div>

        <Section title="图标 Icon">
          <div {...stylex.attrs(styles.row)}>
            <Icon icon={Star} size="xs" />
            <Icon icon={Star} size="sm" />
            <Icon icon={Star} size="md" />
            <Icon icon={Star} size="lg" />
            <Icon icon={Star} size="xl" />
            <Icon icon={ArrowRight} flipInRtl />
          </div>
        </Section>

        <Section title="读屏文字 VisuallyHidden">
          <div {...stylex.attrs(styles.row)}>
            <button type="button" class="icon-only" {...stylex.attrs(styles.iconButton)}>
              <Icon icon={Settings} />
              <VisuallyHidden>设置</VisuallyHidden>
            </button>
          </div>
        </Section>

        <Section title="文本 Heading · Text · Link · Code · Kbd">
          <Heading level={1} class="heading-demo">
            一级标题
          </Heading>
          <Heading level={3}>三级标题</Heading>
          <Text as="p" tone="muted" size="sm">
            次要说明文字
          </Text>
          <Flex gap="sm" wrap>
            {(['accent', 'danger', 'success', 'warning', 'info'] as const).map((tone) => (
              <Text key={tone} tone={tone} weight="medium">
                {tone}
              </Text>
            ))}
          </Flex>
          <Text as="p" class="clamp-demo" lineClamp={2} {...stylex.attrs(styles.narrow)}>
            多行截断：这是一段比较长的说明文字，超过两行之后会被截断并在末尾显示省略号，完整内容不会撑开布局。
            这一句话会被隐藏起来，用来确认截断确实生效。
          </Text>
          <Text as="p">
            阅读 <Link href="#">使用说明</Link>，或查看{' '}
            <Link href="https://example.com" external class="external-demo">
              外部文档
            </Link>
            ；运行 <Code>pnpm install</Code>，按 <Kbd>Ctrl</Kbd> + <Kbd>K</Kbd> 搜索。
          </Text>
        </Section>

        <Section title="布局 Flex · Grid · Container · Separator">
          <Flex class="flex-demo" gap="sm" align="center" wrap>
            <span {...stylex.attrs(styles.card)}>一</span>
            <span {...stylex.attrs(styles.card)}>二</span>
            <Separator class="separator-demo" orientation="vertical" decorative={false} />
            <span {...stylex.attrs(styles.card)}>三</span>
          </Flex>
          <Grid class="grid-demo" minItemWidth="10em" gap="md">
            {['甲', '乙', '丙', '丁', '戊', '己'].map((name) => (
              <div key={name} {...stylex.attrs(styles.card)}>
                {name}
              </div>
            ))}
          </Grid>
          <Separator />
          <Container
            class="container-demo"
            size="xs"
            padding="md"
            {...stylex.attrs(styles.outlined)}
          >
            <p {...stylex.attrs(styles.paragraph)}>最大宽度 30rem，水平居中</p>
          </Container>
        </Section>

        <Section title="折叠 Collapsible">
          <Collapsible
            class="details"
            trigger={(props) => (
              <Button variant="outline" class="details-trigger" {...props}>
                高级选项
              </Button>
            )}
          >
            <p {...stylex.attrs(styles.paragraph)}>
              收起时内容带
              hidden=&quot;until-found&quot;：用浏览器的页内搜索找“隐藏的关键词”会自动展开。
            </p>
          </Collapsible>
        </Section>

        <Section title="动效 Anime.js">
          <div {...stylex.attrs(styles.row)}>
            <Button variant="outline" class="move-ball" onClick={move}>
              移动
            </Button>
            <div {...stylex.attrs(styles.track)}>
              <div class="ball" ref={_toRef(ball)} {...stylex.attrs(styles.ball)} />
            </div>
          </div>
        </Section>
      </main>
    </Provider>
  );
});
