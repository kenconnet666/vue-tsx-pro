// 降本管理案例共用的外壳：顶栏（品牌、本页的页签、收件箱与我负责的任务、当前用户）与侧栏导航，current 是当前所在的一项。
// 侧栏按需求的模块排：两条渠道、任务池、一本账、测算、储备库、统计、基础数据（侧栏不放计数：数字只在一处出现）；
// 工作台（收件箱、我负责的任务）是图标按钮，右上角是条数，点开看详情。
// 做好的案例页之间可以跳转（同一个文档站里的整页示例），一本账点数字跳到筛好条件的任务池
import {
  Archive,
  BookOpenText,
  Building2,
  Calculator,
  ChartColumn,
  ClipboardList,
  Inbox,
  Lightbulb,
  ListTodo,
  Package,
  Plane,
  Users,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  AppShell,
  Avatar,
  Icon,
  IconButton,
  Indicator,
  Link,
  NavItem,
  NavList,
  NavSection,
  Popover,
  Provider,
  Small,
  StatusBadge,
  Text,
  type ComponentDefaults,
  type IconData,
} from '@vue-tsx-pro/ui';
import { inject, type VNodeChild } from 'vue';
import { routeLocationKey, routerKey } from 'vue-router';
import { daysBetween, inbox, myTasks, taskStatuses, TODAY } from './data';

/** 已经做好的案例页 */
export type CasePage = 'TaskPool' | 'TaskDetail' | 'CostDashboard' | 'ProjectEditor';

/** 案例页的地址（文档站的整页示例），query 是带过去的筛选条件 */
export function casePath(page: CasePage, query: Record<string, string> = {}): string {
  const search = new URLSearchParams(query).toString();
  return `${import.meta.env.BASE_URL}frame/cases/${page}/frames/${page}${search ? `?${search}` : ''}`;
}

/** 跳到另一个案例页（保存后去详情、删除后回列表）；不在路由里（单元测试）时什么也不做 */
export function useCaseNavigate(): (page: CasePage, query?: Record<string, string>) => void {
  const router = inject(routerKey, null);
  return (page, query) => void router?.push(casePath(page, query));
}

/** 当前地址上的查询参数（从别的页跳过来时带的筛选）；不在路由里（单元测试）时为空 */
export function useCaseQuery(): () => Record<string, string> {
  const route = inject(routeLocationKey, null);
  return () =>
    Object.fromEntries(
      Object.entries(route?.query ?? {}).map(([key, value]) => [key, String(value ?? '')]),
    );
}

/** 侧栏的各项 */
export type CaseSection =
  | 'proposals'
  | 'plans'
  | 'tasks'
  | 'ledger'
  | 'model'
  | 'reserve'
  | 'dashboard'
  | 'people'
  | 'parts';

interface NavEntry {
  key: CaseSection;
  icon: IconData;
  label: string;
  /** 做好的案例页 */
  page?: CasePage;
}

const groups: { label: string; items: NavEntry[] }[] = [
  {
    label: '两条渠道',
    items: [
      { key: 'proposals', icon: Lightbulb, label: '渠道一 · 供应商建议' },
      { key: 'plans', icon: Users, label: '渠道二 · 项目团队方案' },
    ],
  },
  {
    label: '执行与收益',
    items: [
      { key: 'tasks', icon: ClipboardList, label: '任务池', page: 'TaskPool' },
      { key: 'ledger', icon: BookOpenText, label: '一本账' },
      { key: 'model', icon: Calculator, label: '测算与参数' },
      { key: 'reserve', icon: Archive, label: '储备库' },
    ],
  },
  {
    label: '统计与基础数据',
    items: [
      { key: 'dashboard', icon: ChartColumn, label: '统计看板', page: 'CostDashboard' },
      { key: 'people', icon: Building2, label: '团队与人员' },
      { key: 'parts', icon: Package, label: '型号、工作包与供应商' },
    ],
  },
];

/** 降本管理的外观默认值：状态标签用直角，与表格的直线对齐 */
const caseDefaults: ComponentDefaults = { Badge: { radius: 'none' } };

const styles = stylex.create({
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_sm',
    flexShrink: 0,
    fontWeight: '_semibold',
    fontSize: '_lg',
  },
  brandMark: { color: '_accentText' },
  // 正文上下的内边距与区块之间的间距一致：列表页的分页贴近窗口底边
  main: { paddingBlock: '_md' },
  // 本页的页签在竖线之后、与正文的起始边对齐，贴着顶栏底边；占满中间
  nav: { display: 'flex', alignSelf: 'stretch', alignItems: 'flex-end', flexGrow: 1, minWidth: 0 },
  tools: { display: 'flex', alignItems: 'center', gap: '_xs', flexShrink: 0 },
  panel: { width: '24rem', padding: 0 },
  panelHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_border',
  },
  list: { listStyle: 'none', margin: 0, padding: 0 },
  item: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems: 'start',
    columnGap: '_sm',
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
    backgroundColor: { default: null, ':hover': '_fillHover' },
  },
  dot: { width: '0.5rem', height: '0.5rem', marginBlockStart: '0.45em', borderRadius: '_full' },
  accent: { backgroundColor: '_accent' },
  warning: { backgroundColor: '_warning' },
  danger: { backgroundColor: '_danger' },
  itemText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  panelFoot: { display: 'flex', justifyContent: 'center', paddingBlock: '_sm' },
});

/** 截止日期的说明：逾期几天、还剩几天 */
function dueText(due: string): { text: string; tone: 'danger' | 'warning' | 'muted' } {
  const days = daysBetween(TODAY, due);
  if (days < 0) return { text: `逾期 ${-days} 天`, tone: 'danger' };
  if (days === 0) return { text: '今天到期', tone: 'warning' };
  return { text: `还剩 ${days} 天`, tone: days <= 7 ? 'warning' : 'muted' };
}

/** 顶栏的一个工作台入口：图标按钮、右上角的条数，点开是列表 */
const Tray = _component(
  ({
    icon,
    label,
    count,
    action,
    children,
  }: {
    icon: IconData;
    label: string;
    count: number;
    action: string;
    children?: VNodeChild;
  }) =>
    () => (
      <Popover
        placement="bottom-end"
        sx={styles.panel}
        trigger={(trigger) => (
          <Indicator count={count} label={`${label}：${count} 项`}>
            <IconButton {...trigger} icon={icon} aria-label={label} />
          </Indicator>
        )}
      >
        <div {...stylex.attrs(styles.panelHead)}>
          <Text size="sm" weight="semibold">
            {label}
          </Text>
          <Small tone="muted">{count} 项</Small>
        </div>
        <ul {...stylex.attrs(styles.list)}>{children}</ul>
        <div {...stylex.attrs(styles.panelFoot)}>
          <Link href="#">{action}</Link>
        </div>
      </Popover>
    ),
);

/** 降本管理的页面外壳 */
export const CaseShell = _component(
  ({
    current,
    nav,
    children,
  }: {
    current: CaseSection;
    /** 顶栏里品牌后面的本页导航（页签） */
    nav?: VNodeChild;
    children?: VNodeChild;
  }) =>
    () => (
      <Provider defaults={caseDefaults}>
        <AppShell
          propsMain={{ sx: styles.main }}
          brand={
            <span {...stylex.attrs(styles.brand)}>
              <Icon icon={Plane} sx={styles.brandMark} />
              联合降本管理
            </span>
          }
          header={
            <>
              <div {...stylex.attrs(styles.nav)}>{nav}</div>
              <div {...stylex.attrs(styles.tools)}>
                <Tray icon={Inbox} label="我的收件箱" count={inbox.length} action="打开收件箱">
                  {inbox.map((message) => (
                    <li key={message.id} {...stylex.attrs(styles.item)}>
                      <span {...stylex.attrs(styles.dot, styles[message.tone])} />
                      <span {...stylex.attrs(styles.itemText)}>
                        <Text size="sm">{message.title}</Text>
                        <Small tone="muted">{message.meta}</Small>
                      </span>
                      <Small tone="muted">{message.time}</Small>
                    </li>
                  ))}
                </Tray>
                <Tray
                  icon={ListTodo}
                  label="我负责的任务"
                  count={myTasks.length}
                  action={`查看全部 ${myTasks.length} 项`}
                >
                  {myTasks.slice(0, 5).map((task) => {
                    const due = dueText(task.due);
                    return (
                      <li key={task.code} {...stylex.attrs(styles.item)}>
                        <StatusBadge statuses={taskStatuses} value={task.status} />
                        <span {...stylex.attrs(styles.itemText)}>
                          <Text size="sm">{task.name}</Text>
                          <Small tone="muted">
                            {task.code} · 截止 {task.due}
                          </Small>
                        </span>
                        <Small tone={due.tone}>{due.text}</Small>
                      </li>
                    );
                  })}
                </Tray>
              </div>
              <Avatar size="sm" name="林小满" />
            </>
          }
          sidebar={
            <NavList aria-label="联合降本管理">
              {groups.map((group) => (
                <NavSection key={group.label} label={group.label}>
                  {group.items.map((item) => (
                    <NavItem
                      key={item.key}
                      href={item.page ? casePath(item.page) : `#${item.key}`}
                      icon={item.icon}
                      active={current === item.key}
                    >
                      {item.label}
                    </NavItem>
                  ))}
                </NavSection>
              ))}
            </NavList>
          }
        >
          {children}
        </AppShell>
      </Provider>
    ),
);
