/**
 * 文档站的外壳：AppShell 的顶栏（站点名、搜索、组件演练场、主题切换、仓库链接）、左侧的站点导航、右侧的本页目录，
 * 正文是当前路由的页面，末尾是上一篇 / 下一篇。
 */
import { Box } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  CommandPalette,
  Container,
  Icon,
  IconLinkButton,
  LoadingBar,
  NavItem,
  NavList,
  NavSection,
  Pager,
  TableOfContents,
  collectHeadings,
  type HeadingEntry,
} from '@vue-tsx-pro/ui';
import { AppShell, ThemeSwitcher } from '@vue-tsx-pro/ui/patterns';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { GithubIcon, REPOSITORY } from './site/github';
import { loadingBar } from './site/loading-bar';
import { allPages, sectionOf, sections } from './site/nav';
import { PropsPlaygroundButton } from './site/PropsPlaygroundButton';
import { isFrame } from './router';
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
    color: '_text',
    fontFamily: '_heading',
    fontSize: '_lg',
    fontWeight: '_semibold',
    textDecoration: 'none',
  },
  brandMark: { color: '_accentText' },
  // 搜索与各个按钮靠顶栏的结束边
  tools: { display: 'flex', alignItems: 'center', gap: '_md', marginInlineStart: 'auto' },
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

  // 从正文收集带 id 的 h2、h3，生成本页目录。页面组件是懒加载的，换页后的下一个 tick 正文可能还没渲染出来
  // （开发服务器忙时尤其明显），所以观察正文的增删，下一帧重新收集；结果没变就不更新，示例里的动画不会让目录跟着重绘
  _effect(() => {
    const root = content;
    if (!root) return;
    let frame = 0;
    const collect = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // 示例里的标题（data-demo 里面）是示例内容，不进本页目录
        const next = collectHeadings(root, 'h2[id]:not([data-demo] *), h3[id]:not([data-demo] *)');
        if (JSON.stringify(next) !== JSON.stringify(headings)) headings = next;
      });
    };
    collect();
    // 只看增删的节点里有没有标题：示例里的动画、计数会频繁改动 DOM，不必每次都重新收集
    const touchesHeadings = (nodes: NodeList) =>
      [...nodes].some(
        (node) =>
          node instanceof Element && (node.matches('h2, h3') || !!node.querySelector('h2, h3')),
      );
    const observer = new MutationObserver((records) => {
      if (
        records.some(
          (record) => touchesHeadings(record.addedNodes) || touchesHeadings(record.removedNodes),
        )
      ) {
        collect();
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  });
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
    // 整页示例在 iframe 里单独渲染，不套站点外壳
    if (isFrame) return <RouterView />;
    const isHome = route.path === '/';
    return (
      <>
        <LoadingBar controller={loadingBar} />
        <AppShell
          brand={
            <RouterLink to="/" {...stylex.attrs(styles.brand)}>
              <Icon icon={Box} sx={styles.brandMark} />
              vue-tsx-pro
            </RouterLink>
          }
          header={
            <div {...stylex.attrs(styles.tools)}>
              <CommandPalette
                items={searchItems}
                onAction={(item) => void router.push(item.value)}
              />
              <PropsPlaygroundButton />
              <ThemeSwitcher preference={preference} />
              <IconLinkButton
                href={REPOSITORY}
                external
                icon={GithubIcon}
                aria-label="GitHub 仓库"
              />
            </div>
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
      </>
    );
  };
});
