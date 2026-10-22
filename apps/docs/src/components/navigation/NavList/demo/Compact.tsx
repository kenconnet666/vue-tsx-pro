// 侧栏窄到只放得下图标：compact 时各项只剩图标（悬停、聚焦看名称），小节标题只剩它的图标（不能点）。
// AppShell 的抽屉式侧栏拖到 160px 以下自动这样，不用写 compact
import {
  BadgeCheck,
  BookOpenText,
  CircleDollarSign,
  FolderKanban,
  Gauge,
  House,
  Wrench,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, NavItem, NavList, NavSection, Switch } from '@vue-tsx-pro/ui';

const sections = [
  {
    label: '降本项目',
    icon: FolderKanban,
    pages: [
      ['单机降本台账', Wrench],
      ['降 DMC 台账', Gauge],
    ],
  },
  {
    label: '收益',
    icon: CircleDollarSign,
    pages: [
      ['收益认定', BadgeCheck],
      ['一本账', BookOpenText],
    ],
  },
] as const;

const styles = stylex.create({
  nav: { width: '15rem', transition: 'width _durations.md _easings.standard' },
  compact: { width: '3.5rem' },
});

export default _component(() => {
  let compact = _state(true);
  let current = _state('单机降本台账');
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Switch checked={_bind(compact)}>只显示图标</Switch>
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
          {sections.map((section) => (
            <NavSection key={section.label} label={section.label} icon={section.icon}>
              {section.pages.map(([page, icon]) => (
                <NavItem
                  key={page}
                  href={`#${encodeURIComponent(page)}`}
                  icon={icon}
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
