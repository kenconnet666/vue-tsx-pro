// 按权限点显示：权限由应用接入（这里用 Provider 的 permissions 模拟），换角色后按钮跟着变
import { Plus, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Can,
  Flex,
  Provider,
  Small,
  ToggleGroup,
  ToggleItem,
  useCan,
} from '@zerodep-dev/vue-tsx-pro-ui';

const ROLES = {
  viewer: [],
  editor: ['cost:project:add'],
  admin: ['cost:project:add', 'cost:project:remove'],
} as const;

type Role = keyof typeof ROLES;

/** 在 Provider 里面才读得到它给的权限：useCan 用来禁用按钮这类需要自己判断的地方 */
const Toolbar = _component(() => {
  const can = useCan();
  return () => (
    <Flex gap="sm" align="center" wrap>
      <Can permission="cost:project:add" fallback={<Small tone="muted">没有新建权限</Small>}>
        <Button icon={Plus}>新建</Button>
      </Can>
      <Can permission="cost:project:remove">
        <Button icon={Trash2} variant="outline" tone="danger">
          删除
        </Button>
      </Can>
      <Button
        variant="ghost"
        tone="neutral"
        disabled={!can(['cost:project:add', 'cost:project:remove'])}
      >
        批量操作
      </Button>
    </Flex>
  );
});

export default _component(() => {
  let role = _state<Role>('editor');
  return () => (
    <Flex direction="column" gap="md" align="start">
      <ToggleGroup _value={role} required aria-label="当前用户的角色" size="sm">
        <ToggleItem value="viewer">只读</ToggleItem>
        <ToggleItem value="editor">编辑</ToggleItem>
        <ToggleItem value="admin">管理员</ToggleItem>
      </ToggleGroup>
      <Provider permissions={(permission) => ROLES[role].some((granted) => granted === permission)}>
        <Toolbar />
      </Provider>
    </Flex>
  );
});
