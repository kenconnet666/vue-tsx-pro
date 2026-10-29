// 数据驱动的侧栏菜单：一棵树交给 NavMenu；示例里不真的换页，用一个状态当“当前路由”
import { Boxes, ClipboardList, House, Settings } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  Flex,
  NavMenu,
  Provider,
  Small,
  ToggleGroup,
  ToggleItem,
  type NavMenuItem,
} from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({
  card: { width: '16rem' },
});

const menu: NavMenuItem[] = [
  { label: '首页', href: '/', icon: House },
  {
    label: '降本管理',
    icon: Boxes,
    children: [
      { label: '降本项目', href: '/projects', badge: 3 },
      { label: '台账', href: '/ledger', icon: ClipboardList },
      { label: '已停用的入口', href: '/legacy', disabled: true },
    ],
  },
  {
    label: '系统',
    icon: Settings,
    children: [
      { label: '用户与角色', href: '/system/users' },
      { label: '数据字典', children: [{ label: '字典类型', href: '/system/dict' }] },
    ],
  },
  // 后端返回的目录下没有该用户能看的页面：不显示
  { label: '审批', children: [] },
];

export default _component(() => {
  let path = _state('/projects');
  let topLevel = _state<'section' | 'group'>('section');
  return () => (
    <Flex gap="lg" align="start" wrap>
      <Provider router={{ navigate: (href) => (path = href), isActive: (href) => href === path }}>
        <Card sx={styles.card} padding="sm">
          <NavMenu aria-label="主菜单" items={menu} topLevel={topLevel} />
        </Card>
      </Provider>
      <Flex direction="column" gap="sm">
        <ToggleGroup _value={topLevel} required aria-label="顶层目录" size="sm">
          <ToggleItem value="section">小节</ToggleItem>
          <ToggleItem value="group">分组</ToggleItem>
        </ToggleGroup>
        <Small tone="muted">当前页：{path}</Small>
      </Flex>
    </Flex>
  );
});
