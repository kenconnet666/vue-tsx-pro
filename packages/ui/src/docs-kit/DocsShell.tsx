/**
 * 文档站的外壳：顶栏（站点名、搜索、主题切换、仓库链接）、左侧的站点导航、右侧的本页目录，正文末尾是上一篇 / 下一篇，
 * 换页时新页面轻轻浮上来。不依赖路由库：当前地址和跳转由使用方给，导航链接走 createUi 的 router。
 *
 *   <DocsShell
 *     name="easy-query TS"
 *     icon={DatabaseZap}
 *     sections={sections}
 *     path={route.path}
 *     onNavigate={(path) => void router.push(path)}
 *     preference={preference}
 *     repository="https://github.com/…"
 *   >
 *     <RouterView />
 *   </DocsShell>
 *
 * 本页目录从正文收集：页面组件常是懒加载的，所以观察正文的增删，下一帧重新收集；结果没变就不更新。
 * 部件：Shell（AppShell）、Tools（div，顶栏右侧）、Page（div，正文）、PagerContainer（Container）、Pager。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { IconLinkButton } from '../base/IconLinkButton';
import type { IconData } from '../base/Icon';
import { useMessages } from '../config/lang/messages';
import type { ThemePreference } from '../config/theme/preference';
import { LoadingBar, type LoadingBarController } from '../feedback/LoadingBar';
import { Container, type ContainerProps } from '../layout/Container';
import { NavItem, NavList, NavSection } from '../navigation/NavList';
import { Pager, type PagerProps } from '../navigation/Pager';
import { TableOfContents } from '../navigation/TableOfContents';
import { CommandPalette } from '../overlay/CommandPalette';
import { AppShell, AppShellBrand, type AppShellProps } from '../patterns/AppShell';
import { ThemeSwitcher } from '../patterns/ThemeSwitcher';
import { mergeAttrs, mergeProps, type PartProps } from '../utils/props';
import { collectHeadings, type HeadingEntry } from '../utils/dom/scroll-spy';
import { docsKitMessages } from './messages';

/** GitHub 标志：Lucide 已移除品牌图标，按它原来的描线画法写（ISC 许可） */
export const GithubIcon: IconData = {
  node: [
    [
      'path',
      {
        d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
        key: 'tonef',
      },
    ],
    ['path', { d: 'M9 18c-4.51 2-5-2-7-2', key: '9comsn' }],
  ],
};

/** 导航里的一页 */
export interface DocsPage {
  /** 地址 */
  readonly path: string;
  /** 标题：侧栏、搜索、翻页、浏览器标签都用它 */
  readonly title: string;
  /** 一句话简介：搜索结果里显示；反引号会去掉 */
  readonly description?: string;
}

/** 侧栏的一组 */
export interface DocsSection {
  /** 组名 */
  readonly label: string;
  /** 组里的页面 */
  readonly pages: readonly DocsPage[];
}

/** DocsShell 的属性 */
export interface DocsShellProps {
  /** 站点名：顶栏与浏览器标签 */
  name: string;
  /** 站点的图标 */
  icon?: IconData;
  /** 站点导航：侧栏、搜索、上一篇 / 下一篇都从这里取，顺序一致 */
  sections: readonly DocsSection[];
  /** 当前地址 */
  path: string;
  /** 当前页的标题：浏览器标签用；不写时从 sections 里找（不在导航里的页面才要写） */
  pageTitle?: string;
  /** 搜索面板里选了一页 */
  onNavigate: (path: string) => void;
  /** 主题偏好（createThemePreference） */
  preference: ThemePreference<string>;
  /** 仓库地址：顶栏放一个 GitHub 链接 */
  repository?: string;
  /** 换页时的加载条（createLoadingBar） */
  loadingBar?: LoadingBarController;
  /** 首页的地址：首页没有本页目录和翻页 @default '/' */
  homePath?: string;
  /** 本页目录收集哪些标题 @default 'h2[id], h3[id]' */
  headingSelector?: string;
  /** 顶栏里主题切换之前放的东西 */
  tools?: VNodeChild;
  /** 外壳（AppShell）的部件属性 */
  propsShell?: Partial<AppShellProps>;
  /** 顶栏右侧的部件属性 */
  propsTools?: PartProps<'div'>;
  /** 正文外层的部件属性 */
  propsPage?: PartProps<'div'>;
  /** 翻页外面的 Container 的部件属性：和正文一样宽 */
  propsPagerContainer?: Partial<ContainerProps>;
  /** 翻页的部件属性 */
  propsPager?: Partial<PagerProps>;
  /** 正文 */
  children?: VNodeChild;
}

const pageEnter = css.keyframes({
  from: { opacity: 0, transform: 'translateY(6px)' },
  to: { opacity: 1, transform: 'none' },
});

/** DocsShell 的样式：tools、page、enter、main、pager */
export const docsShellStyles = css.create({
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

/** 增删的节点里有没有标题：正文里的动画、计数会频繁改动 DOM，不必每次都重新收集 */
const touchesHeadings = (nodes: NodeList) =>
  [...nodes].some(
    (node) => node instanceof Element && (node.matches('h2, h3') || !!node.querySelector('h2, h3')),
  );

/** 文档站的外壳 */
export const DocsShell = _component(
  ({
    name,
    icon,
    sections,
    path,
    pageTitle,
    onNavigate,
    preference,
    repository,
    loadingBar,
    homePath = '/',
    headingSelector = 'h2[id], h3[id]',
    tools,
    propsShell,
    propsTools,
    propsPage,
    propsPagerContainer,
    propsPager,
    children,
  }: DocsShellProps) => {
    const messages = useMessages('docsKit', docsKitMessages);
    let content = _state.raw<HTMLElement | null>(null);
    let headings = _state.raw<HeadingEntry[]>([]);

    const pages = _derived(sections.flatMap((section) => section.pages));
    const searchItems = _derived(
      sections.flatMap((section) =>
        section.pages.map((page) => ({
          value: page.path,
          label: page.title,
          description: page.description?.replaceAll('`', ''),
          group: section.label,
        })),
      ),
    );

    _effect(() => {
      const root = content;
      const selector = headingSelector;
      if (!root) return;
      let frame = 0;
      const collect = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const next = collectHeadings(root, selector);
          if (JSON.stringify(next) !== JSON.stringify(headings)) headings = next;
        });
      };
      collect();
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

    // 浏览器标签上的标题（_effect 不在服务端执行：预渲染时由使用方写进 <title>）
    _effect(() => {
      const title = pageTitle || pages.find((page) => page.path === path)?.title;
      document.title = title ? `${title} · ${name}` : name;
    });

    const neighbors = () => {
      const index = pages.findIndex((page) => page.path === path);
      if (index < 0) return {};
      const link = (page: DocsPage | undefined) => page && { href: page.path, label: page.title };
      return { previous: link(pages[index - 1]), next: link(pages[index + 1]) };
    };

    return () => {
      const isHome = path === homePath;
      return (
        <>
          {loadingBar && <LoadingBar controller={loadingBar} />}
          <AppShell
            {...mergeProps<AppShellProps>(
              {
                brand: (
                  <AppShellBrand href={homePath} icon={icon}>
                    {name}
                  </AppShellBrand>
                ),
                header: (
                  <div {...mergeAttrs<'div'>({ sx: docsShellStyles.tools }, propsTools)}>
                    <CommandPalette
                      items={searchItems}
                      onAction={(item) => onNavigate(item.value)}
                    />
                    {tools}
                    <ThemeSwitcher preference={preference} />
                    {repository && (
                      <IconLinkButton
                        href={repository}
                        external
                        icon={GithubIcon}
                        aria-label={messages.repository}
                      />
                    )}
                  </div>
                ),
                sidebar: (
                  <NavList aria-label={messages.navigation}>
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
                ),
                aside: !isHome && headings.length > 0 && <TableOfContents items={headings} />,
                propsMain: { sx: docsShellStyles.main },
              },
              propsShell,
            )}
          >
            <div
              {...mergeAttrs<'div'>({ sx: docsShellStyles.page }, propsPage, {
                ref: _toRef(content),
              })}
            >
              {/* 按地址换 key：每次换页重新播放进场动画 */}
              <div key={path} {...css.attrs(docsShellStyles.enter)}>
                {children}
              </div>
              {!isHome && (
                <Container
                  {...mergeProps<ContainerProps>(
                    { size: 'md', padding: 'none' },
                    propsPagerContainer,
                  )}
                >
                  <Pager
                    {...mergeProps<PagerProps>(
                      { ...neighbors(), sx: docsShellStyles.pager },
                      propsPager,
                    )}
                  />
                </Container>
              )}
            </div>
          </AppShell>
        </>
      );
    };
  },
);
