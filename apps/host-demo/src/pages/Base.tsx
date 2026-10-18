// 基础组件演示（文档站暂缓，先在这里按分类演示）：每加一批组件就加一节
import { ArrowRight, Settings, Star } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { darkTheme, Icon, lightTheme, Provider, VisuallyHidden } from '@vue-tsx-pro/ui';
import { colors, fontSizes, space } from '@vue-tsx-pro/ui/tokens.stylex';
import type { VNodeChild } from 'vue';
import { Button } from '../pilot/Button';

const styles = stylex.create({
  page: {
    display: 'grid',
    alignContent: 'start',
    gap: space.xl,
    padding: space.xl,
    minHeight: '100vh',
    backgroundColor: colors.background,
  },
  section: { display: 'grid', gap: space.md },
  title: { margin: 0, fontSize: fontSizes.lg },
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: space.md },
  iconButton: {
    display: 'inline-flex',
    padding: space.sm,
    borderWidth: 0,
    backgroundColor: colors.fill,
    color: colors.text,
  },
});

const Section = _component(
  ({ title, children }: { title: string; children?: VNodeChild }) =>
    () => (
      <section {...stylex.attrs(styles.section)}>
        <h2 {...stylex.attrs(styles.title)}>{title}</h2>
        {children}
      </section>
    ),
);

export const Base = _component(() => {
  let dark = _state(false);

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
      </main>
    </Provider>
  );
});
