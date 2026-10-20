/**
 * 文档站的外壳：AppShell 的顶栏（站点名、搜索、组件演练场、主题切换、仓库链接）、左侧的站点导航、右侧的本页目录，
 * 正文是当前路由的页面，末尾是上一篇 / 下一篇。
 */
import { Box } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  AppShell,
  CommandPalette,
  Container,
  Icon,
  IconLinkButton,
  NavItem,
  NavList,
  NavSection,
  Pager,
  TableOfContents,
  ThemeSwitcher,
  collectHeadings,
  type HeadingEntry,
} from '@vue-tsx-pro/ui';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { nextTick, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { GithubIcon, REPOSITORY } from './site/github';
import { allPages, sectionOf, sections } from './site/nav';
import { PropsPlaygroundButton } from './site/PropsPlaygroundButton';
import { preference } from './site/theme';

const pageEnter = stylex.keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'none' },
});

const styles = stylex.create({
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_sm',
    marginInlineEnd: 'auto',
    color: '_text',
    fontFamily: '_heading',
    fontSize: '_lg',
    fontWeight: '_semibold',
    textDecoration: 'none',
  },
  brandMark: { color: '_accentText' },
  page: { display: 'flex', flexDirection: 'column', gap: '_xl' },
  // 换页时新页面轻轻浮上来；时长取主题 token，“减少动态效果”时为 0
  enter: {
    animationName: pageEnter,
    animationDuration: '_durations.md',
    animationTimingFunction: '_easings.enter',
  },
  // 标题离顶栏远一点，页底留出空白，不贴着窗口下沿
  main: { paddingBlockStart: '2.5rem', paddingBlockEnd: '4rem' },
  pager: { marginBlockStart: '_xl' },
});

/** 搜索面板的选项：每个页面一项，按侧栏分组 */
const searchItems = allPages.map((page) => ({
  value: page.path,
  label: page.title,
  description: page.description,
  group: sectionOf(page),
}));

export const App = _component(() => {
  const route = useRoute();
  const router = useRouter();
  let content = _state.raw<HTMLElement | null>(null);
  let headings = _state.raw<HeadingEntry[]>([]);

  // 换页后从正文收集带 id 的 h2、h3，生成本页目录
  watch(
    () => route.path,
    async () => {
      await nextTick();
      headings = content ? collectHeadings(content) : [];
    },
    { flush: 'post', immediate: true },
  );
  // 浏览器标签上的标题
  watch(
    () => route.meta.title as string | undefined,
    (title) => (document.title = title ? `${title} · vue-tsx-pro` : 'vue-tsx-pro'),
    { immediate: true },
  );

  const neighbors = () => {
    const index = allPages.findIndex((page) => page.path === route.path);
    if (index < 0) return {};
    const link = (page: (typeof allPages)[number] | undefined) =>
      page && { href: page.path, label: page.title };
    return { previous: link(allPages[index - 1]), next: link(allPages[index + 1]) };
  };

  return () => {
    const isHome = route.path === '/';
    return (
      <AppShell
        header={
          <>
            <RouterLink to="/" {...stylex.attrs(styles.brand)}>
              <Icon icon={Box} sx={styles.brandMark} />
              vue-tsx-pro
            </RouterLink>
            <CommandPalette items={searchItems} onAction={(item) => void router.push(item.value)} />
            <PropsPlaygroundButton />
            <ThemeSwitcher preference={preference} />
            <IconLinkButton href={REPOSITORY} external icon={GithubIcon} aria-label="GitHub 仓库" />
          </>
        }
        sidebar={
          <NavList aria-label="文档">
            {sections.map((section) => (
              <NavSection key={section.label} label={section.label}>
                {section.pages.map((page) => (
                  <NavItem key={page.path} href={page.path}>
                    {page.title}
                  </NavItem>
                ))}
              </NavSection>
            ))}
          </NavList>
        }
        aside={!isHome && headings.length > 0 && <TableOfContents items={headings} />}
        propsMain={{ sx: styles.main }}
      >
        <div ref={_toRef(content)} {...stylex.attrs(styles.page)}>
          {/* 按路由换 key：每次换页重新播放进场动画 */}
          <div key={route.path} {...stylex.attrs(styles.enter)}>
            <RouterView />
          </div>
          {!isHome && (
            <Container size={route.path.startsWith('/components/') ? 'xl' : 'md'} padding="none">
              <Pager {...neighbors()} sx={styles.pager} />
            </Container>
          )}
        </div>
      </AppShell>
    );
  };
});
