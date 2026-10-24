/**
 * 站点导航的数据：指南页手写，组件页来自 virtual:doc-pages（按分类分组、按 order 排序）。
 * 侧栏、命令面板的搜索、页面底部的上一篇 / 下一篇都从这里取，顺序一致。
 */
import componentPages from 'virtual:doc-pages';
import type { Component } from 'vue';
import { PLAYGROUND_PATH } from '../playground/share';
import type { PageMeta } from './types';

/** 一个页面 */
export interface NavPage extends PageMeta {
  /** 路由地址 */
  path: string;
  /** 页面组件（懒加载） */
  component: () => Promise<{ default: Component }>;
}

/** 侧栏里的一组 */
export interface NavSection {
  /** 组名 */
  label: string;
  /** 组里的页面 */
  pages: NavPage[];
}

/** 组件分类：目录名 → 侧栏里的组名，也是侧栏里的顺序 */
const CATEGORIES: [string, string][] = [
  ['base', '基础'],
  ['layout', '布局'],
  ['display', '展示'],
  ['feedback', '反馈'],
  ['overlay', '浮层'],
  ['navigation', '导航'],
  ['input', '输入'],
  ['date', '日期'],
  ['form', '表单'],
  ['table', '表格'],
  ['patterns', '页面组合'],
  ['workflow', '流程'],
  // 依赖第三方库的子路径单独成组，组名写明库名（都是可选 peer，用到才装）：
  // 图表是 @vue-tsx-pro/ui/charts（基于 Unovis），3D 是 @vue-tsx-pro/ui/three（基于 three.js）
  ['charts', '图表 · @unovis/ts'],
  ['effects', '效果'],
  ['three', '3D · three.js'],
  ['config', '配置'],
];

/** 分类目录名 → 组名 */
export const CATEGORY_LABELS: Readonly<Record<string, string>> = Object.fromEntries(CATEGORIES);

/** Button → button，IconButton → icon-button */
export const kebab = (name: string) => name.replace(/(?<=[a-z0-9])([A-Z])/g, '-$1').toLowerCase();

const guide: NavSection = {
  label: '指南',
  pages: [
    {
      path: '/guide/getting-started',
      title: 'Getting Started 快速开始',
      description: '安装、配置 Vite 与 createUi，写第一个 TSX 页面',
      component: () => import('../pages/guide/GettingStarted'),
    },
    {
      path: '/guide/theming',
      title: 'Theming 主题定制',
      description: '调品牌色、中性色、圆角、缩放、字体与动效，实时检查对比度，导出代码',
      component: () => import('../pages/guide/Theming'),
    },
    {
      path: '/guide/design-resources',
      title: 'Design Resources 设计资源',
      description: '每套主题导出成 Figma 变量（DTCG JSON），Figma 设计文件、图标与整页示例',
      component: () => import('../pages/guide/DesignResources'),
    },
    {
      path: '/guide/data',
      title: 'Data 请求与数据',
      description: '配置请求客户端、换成 axios 或 ky，useRequest 管加载、出错、防抖与取消',
      component: () => import('../pages/guide/Data'),
    },
    {
      path: PLAYGROUND_PATH,
      title: 'Playground 代码演练场',
      description: '在浏览器里改代码、立即看效果，复制链接分享；示例卡片上的“编辑”把示例带进来',
      component: () => import('../pages/Playground'),
    },
  ],
};

const componentSections: NavSection[] = CATEGORIES.map(([category, label]) => ({
  label,
  pages: componentPages
    .filter((page) => page.category === category)
    .sort(
      (a, b) =>
        (a.meta.order ?? Infinity) - (b.meta.order ?? Infinity) || a.name.localeCompare(b.name),
    )
    .map((page) => ({
      ...page.meta,
      path: `/components/${kebab(page.name)}`,
      component: page.load,
    })),
})).filter((section) => section.pages.length > 0);

/** 侧栏的各组 */
export const sections: NavSection[] = [guide, ...componentSections];

/** 所有页面，按侧栏顺序：翻页与搜索用 */
export const allPages: NavPage[] = sections.flatMap((section) => section.pages);

/** 页面所在的组名 */
export function sectionOf(page: NavPage): string {
  return sections.find((section) => section.pages.includes(page))!.label;
}
