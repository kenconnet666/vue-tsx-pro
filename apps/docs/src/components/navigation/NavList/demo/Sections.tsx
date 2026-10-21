import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Badge, Card, NavItem, NavList, NavSection } from '@vue-tsx-pro/ui';

const sections = [
  ['指南', ['快速开始', '主题定制', '国际化']],
  ['组件', ['Button 按钮', 'Dialog 对话框', 'Tabs 标签页', 'DataTable 数据表格']],
  ['资源', ['更新日志', '设计资源']],
] as const;

const styles = stylex.create({ nav: { width: '15rem' } });

export default _component(() => {
  let current = _state('Dialog 对话框');
  return () => (
    <Card padding="sm" sx={styles.nav}>
      <NavList aria-label="文档">
        {sections.map(([label, pages]) => (
          <NavSection key={label} label={label}>
            {pages.map((page) => (
              <NavItem
                key={page}
                href={`#${encodeURIComponent(page)}`}
                active={current === page}
                // 还没上线的页面：不能点、不能聚焦
                disabled={page === '设计资源'}
                end={page === '设计资源' && <Badge variant="soft">即将上线</Badge>}
                onClick={() => (current = page)}
              >
                {page}
              </NavItem>
            ))}
          </NavSection>
        ))}
      </NavList>
    </Card>
  );
});
