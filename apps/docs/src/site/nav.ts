/**
 * 站点导航的数据：指南页手写，组件页来自 virtual:doc-pages（按分类分组、按 order 排序）。
 * 侧栏、命令面板的搜索、页面底部的上一篇 / 下一篇都从这里取，顺序一致。
 */
import componentPages from 'virtual:doc-pages';
import type { Component } from 'vue';
import { MOBILE_SECTIONS } from '../pages/mobile/sections';
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
  ['diagram', '画布'],
  // 子路径单独成组：图表是 @zerodep-dev/vue-tsx-pro-ui/charts（自己画的 SVG，没有第三方依赖）；
  // 依赖第三方库的组名写明库名（可选 peer，用到才装）：3D 是 @zerodep-dev/vue-tsx-pro-ui/three（基于 three.js）
  ['charts', '图表'],
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
      path: '/guide/styling',
      title: 'Styling 写样式',
      description: 'css.create、attrs 与 sx，主题 token，状态跟着 DOM 走，随状态变的样式与定制组件',
      component: () => import('../pages/guide/Styling'),
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

/** 全栈：ORM、框架、流程引擎（不在组件库里，仓库里的另外几个包） */
const stack: NavSection = {
  label: '全栈',
  pages: [
    {
      path: '/stack/orm',
      title: 'ORM easy-query TS',
      description: '实体与导航、lambda 条件、隐式 join 与子查询、对象树结果，接表格、事务与锁',
      component: () => import('../pages/stack/Orm'),
    },
    {
      path: '/stack/orm/start',
      title: 'ORM 快速开始',
      description: '安装、实体与关系、建 Db、第一条查询；连库时自动读版本',
      component: () => import('../pages/stack/orm/Start'),
    },
    {
      path: '/stack/orm/query',
      title: 'ORM 查询',
      description: '条件、分页、分组、窗口、子查询、CTE、原生 SQL、深分页',
      component: () => import('../pages/stack/orm/Query'),
    },
    {
      path: '/stack/orm/navigate',
      title: 'ORM 导航与 DTO',
      description: '关系、隐式 join 与子查询、对象树、视图、筛选排序、计算属性',
      component: () => import('../pages/stack/orm/Navigate'),
    },
    {
      path: '/stack/orm/write',
      title: 'ORM 写入与保存',
      description: 'upsert、更新删除、批量、聚合保存、事务、拦截器',
      component: () => import('../pages/stack/orm/Write'),
    },
    {
      path: '/stack/orm/functions',
      title: 'ORM 函数',
      description: '字符串、日期、数学、JSON、窗口与方言专属函数',
      component: () => import('../pages/stack/orm/Functions'),
    },
    {
      path: '/stack/orm/code-first',
      title: 'ORM 建表与同步',
      description: '建表、planSync / syncTables、由表生成实体',
      component: () => import('../pages/stack/orm/CodeFirst'),
    },
    {
      path: '/stack/orm/scale',
      title: 'ORM 缓存与分库分表',
      description: '二级缓存、分表、分库归并、读写分离',
      component: () => import('../pages/stack/orm/Scale'),
    },
    {
      path: '/stack/orm/dialects',
      title: 'ORM 方言',
      description: '各数据库的方言包、按版本渲染的原则、差异与测试',
      component: () => import('../pages/stack/orm/Dialects'),
    },
    {
      path: '/stack/framework',
      title: 'Framework 全栈框架',
      description: '按页面选渲染模式，loader 与 action，请求上下文、会话与权限',
      component: () => import('../pages/stack/Framework'),
    },
    {
      path: '/stack/flow',
      title: 'Flow 流程引擎',
      description: '定义、一个命令入口、扩展点、试运行、流程图与低代码设计器',
      component: () => import('../pages/stack/Flow'),
    },
  ],
};

// 移动端：概览加上按演示页分的几组（sections.ts），分组页共用一个页面组件
const mobile: NavSection = {
  label: '移动端',
  pages: [
    {
      path: '/mobile',
      title: 'Mobile 移动端',
      description: '同一份 TSX 页面跑在 H5、微信小程序、支付宝小程序：安装、构建、写法约束与测试',
      component: () => import('../pages/mobile/Overview'),
    },
    ...MOBILE_SECTIONS.map(({ demo, title, description }) => ({
      path: `/mobile/${demo}`,
      title,
      description,
      component: async () => ({
        default: (await import('../pages/mobile/Section')).sectionPage(demo),
      }),
    })),
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
export const sections: NavSection[] = [guide, stack, mobile, ...componentSections];

/** 所有页面，按侧栏顺序：翻页与搜索用 */
export const allPages: NavPage[] = sections.flatMap((section) => section.pages);

/** 页面所在的组名 */
export function sectionOf(page: NavPage): string {
  return sections.find((section) => section.pages.includes(page))!.label;
}
