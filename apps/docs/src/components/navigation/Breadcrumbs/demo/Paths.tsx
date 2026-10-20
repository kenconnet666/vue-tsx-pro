import { Folder, House, Slash } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Breadcrumbs, Flex, Icon, Small } from '@vue-tsx-pro/ui';

// 示例里的链接只写锚点：点了不离开文档
const deep = [
  { label: '首页', href: '#home', icon: House },
  { label: '项目', href: '#projects' },
  { label: '官网改版', href: '#redesign' },
  { label: '设计稿', href: '#designs' },
  { label: '2026 秋季', href: '#autumn' },
  { label: '首页 v3.fig' },
];

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <Flex direction="column" gap="xs">
      <Small tone="muted">默认：最后一项是当前页，不是链接</Small>
      <Breadcrumbs
        aria-label="订单位置"
        items={[
          { label: '首页', href: '#home', icon: House },
          { label: '订单', href: '#orders' },
          { label: '#10234' },
        ]}
      />
    </Flex>
    <Flex direction="column" gap="xs">
      <Small tone="muted">maxItems={'{4}'}：中间几级收进菜单</Small>
      <Breadcrumbs aria-label="设计稿位置" items={deep} maxItems={4} />
    </Flex>
    <Flex direction="column" gap="xs">
      <Small tone="muted">自定义分隔符与图标</Small>
      <Breadcrumbs
        aria-label="代码位置"
        separator={<Icon icon={Slash} />}
        items={[
          { label: 'vue-tsx-pro', href: '#repo', icon: Folder },
          { label: 'packages', href: '#packages', icon: Folder },
          { label: 'ui', href: '#ui', icon: Folder },
          { label: 'src' },
        ]}
      />
    </Flex>
  </Flex>
));
