import {
  ChartLine,
  FilePlus,
  House,
  LogOut,
  Moon,
  Package,
  Settings,
  ShoppingCart,
  UserPlus,
  Users,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { CommandPalette, Flex, Kbd, Small, type ListboxOption } from '@vue-tsx-pro/ui';

const commands: ListboxOption[] = [
  { value: 'home', label: '概览', icon: House, group: '页面' },
  {
    value: 'orders',
    label: '订单',
    description: '全部订单、退款与售后',
    icon: ShoppingCart,
    group: '页面',
  },
  { value: 'products', label: '商品', icon: Package, group: '页面' },
  { value: 'customers', label: '客户', icon: Users, group: '页面' },
  {
    value: 'reports',
    label: '报表',
    description: '销售、库存、流量',
    icon: ChartLine,
    group: '页面',
  },
  { value: 'new-product', label: '新建商品', icon: FilePlus, group: '操作' },
  { value: 'invite', label: '邀请成员', icon: UserPlus, group: '操作' },
  { value: 'theme', label: '切换暗色模式', icon: Moon, group: '操作' },
  { value: 'settings', label: '设置', icon: Settings, group: '操作' },
  { value: 'logout', label: '退出登录', icon: LogOut, group: '操作', disabled: true },
];

export default _component(() => {
  let last = _state('');
  return () => (
    <Flex direction="column" gap="md" align="start">
      <CommandPalette
        items={commands}
        hotkey="Mod+J"
        label="命令"
        placeholder="输入命令或页面名称"
        onAction={(command) => (last = command.label)}
      />
      <Small tone="muted">
        也可以按 <Kbd>Ctrl</Kbd> + <Kbd>J</Kbd>（macOS 上 <Kbd>⌘</Kbd> + <Kbd>J</Kbd>）打开。
        {last && ` 执行了：${last}`}
      </Small>
    </Flex>
  );
});
