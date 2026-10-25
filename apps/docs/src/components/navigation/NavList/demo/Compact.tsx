// 侧栏窄到只放得下图标：compact 时各项只剩图标（悬停、聚焦看名称），小节标题只剩它的图标（不能点），
// 分组悬停时子项从右边弹出来；待办的计数叠在图标上。AppShell 的抽屉式侧栏拖到 160px 以下自动这样，不用写 compact
import {
  BadgeCheck,
  BookOpenText,
  CircleDollarSign,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  House,
  Wrench,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Flex, NavGroup, NavItem, NavList, NavSection, Switch, t } from '@vue-tsx-pro/ui';

const sections = [
  {
    label: '降本项目',
    icon: FolderKanban,
    pages: [
      ['单机降本台账', Wrench, 0],
      ['降 DMC 台账', Gauge, 0],
    ],
  },
  {
    label: '收益',
    icon: CircleDollarSign,
    pages: [
      ['收益认定', BadgeCheck, 12],
      ['一本账', BookOpenText, 0],
    ],
  },
] as const;

const approvals = [
  ['待我审批', 4],
  ['我发起的', 0],
] as const;

const styles = css.create({
  nav: { width: '15rem', transition: `width ${t.durations.md} ${t.easings.standard}` },
  compact: { width: '3.5rem' },
});

export default _component(() => {
  let compact = _state(true);
  let current = _state('单机降本台账');
  const link = (page: string) => `#${encodeURIComponent(page)}`;
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Switch _checked={_bind(compact)}>只显示图标</Switch>
      <Card padding="xs" sx={[styles.nav, compact && styles.compact]}>
        <NavList aria-label="降本管理" compact={compact}>
          <NavItem
            href="#home"
            icon={House}
            active={current === '首页'}
            onClick={() => (current = '首页')}
          >
            首页
          </NavItem>
          <NavGroup label="审批" icon={ClipboardCheck}>
            {approvals.map(([page, count]) => (
              <NavItem
                key={page}
                href={link(page)}
                badge={count}
                active={current === page}
                onClick={() => (current = page)}
              >
                {page}
              </NavItem>
            ))}
          </NavGroup>
          {sections.map((section) => (
            <NavSection key={section.label} label={section.label} icon={section.icon}>
              {section.pages.map(([page, icon, count]) => (
                <NavItem
                  key={page}
                  href={link(page)}
                  icon={icon}
                  badge={count}
                  active={current === page}
                  onClick={() => (current = page)}
                >
                  {page}
                </NavItem>
              ))}
            </NavSection>
          ))}
        </NavList>
      </Card>
    </Flex>
  );
});
