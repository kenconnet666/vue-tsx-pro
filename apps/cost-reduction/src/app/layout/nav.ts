/**
 * 侧栏导航：按模块分组。侧栏不放计数（数字只在一处出现）；还没做的模块先列出、链到规划（设计规格）。
 * 哪些角色看得到一项由 roles 决定，不写时都看得到
 */
import {
  Archive,
  BadgeCheck,
  BookOpenText,
  Building2,
  Calculator,
  CircleDollarSign,
  FileText,
  FolderKanban,
  Gauge,
  House,
  Library,
  Lightbulb,
  Split,
  Users,
  Wrench,
} from '@lucide/icons';
import type { IconData } from '@vue-tsx-pro/ui';
import type { RouteLocationNormalized } from 'vue-router';
import type { RoleKey } from '../../domain/roles';
import { paths } from '../paths';

/** 侧栏的一项：路由的 meta.section 指向它，当前页的那项高亮 */
export type NavKey =
  | 'dashboard'
  | 'unit'
  | 'dmc'
  | 'confirm'
  | 'ledger'
  | 'proposals'
  | 'plans'
  | 'params'
  | 'reserve'
  | 'master'
  | 'spec';

/** 侧栏的一项 */
export interface NavEntry {
  /** 标识 */
  key: NavKey;
  /** 图标 */
  icon: IconData;
  /** 名称 */
  label: string;
  /** 地址；还没做的模块链到设计规格里它的那一节 */
  href: string;
  /** 看得到它的角色；不写时都看得到 */
  roles?: readonly RoleKey[];
}

/** 首页 */
export const homeEntry: NavEntry = {
  key: 'dashboard',
  icon: House,
  label: '首页 · 统计看板',
  href: paths.dashboard(),
};

const internal: readonly RoleKey[] = [
  'cost',
  'pemo',
  'product',
  'project',
  'business',
  'finance',
  'admin',
];

/** 侧栏的分组：图标标在小节标题前（不能点），侧栏拖窄只剩图标时代替标题 */
export const navGroups: readonly { label: string; icon: IconData; items: readonly NavEntry[] }[] = [
  {
    label: '降本项目',
    icon: FolderKanban,
    items: [
      {
        key: 'unit',
        icon: Wrench,
        label: '单机降本台账',
        href: paths.ledger('unit'),
        roles: internal,
      },
      { key: 'dmc', icon: Gauge, label: '降 DMC 台账', href: paths.ledger('dmc'), roles: internal },
    ],
  },
  {
    label: '收益',
    icon: CircleDollarSign,
    items: [
      {
        key: 'confirm',
        icon: BadgeCheck,
        label: '收益认定',
        href: paths.confirm(),
        roles: internal,
      },
      {
        key: 'ledger',
        icon: BookOpenText,
        label: '一本账',
        href: paths.valueLedger(),
        roles: internal,
      },
    ],
  },
  {
    label: '两条渠道',
    icon: Split,
    items: [
      {
        key: 'proposals',
        icon: Lightbulb,
        label: '渠道一 · 供应商建议',
        href: `${paths.spec()}#page-channels`,
      },
      {
        key: 'plans',
        icon: Users,
        label: '渠道二 · 项目团队方案',
        href: `${paths.spec()}#page-channels`,
        roles: internal,
      },
    ],
  },
  {
    label: '分析与资料',
    icon: Library,
    items: [
      {
        key: 'params',
        icon: Calculator,
        label: '测算参数',
        href: `${paths.spec()}#metrics`,
        roles: internal,
      },
      {
        key: 'reserve',
        icon: Archive,
        label: '储备库',
        href: `${paths.spec()}#page-reserve`,
        roles: internal,
      },
      {
        key: 'master',
        icon: Building2,
        label: '基础数据',
        href: `${paths.spec()}#navigation`,
        roles: internal,
      },
      { key: 'spec', icon: FileText, label: '设计规格', href: paths.spec() },
    ],
  },
];

/** 当前页在侧栏里高亮的一项（路由的 meta.section） */
export function sectionOf(route: RouteLocationNormalized): NavKey | undefined {
  const section = route.meta.section;
  return typeof section === 'function' ? section(route) : section;
}
