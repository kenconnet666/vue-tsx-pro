// 第一次打开时才去取选项（loading 期间列表里是骨架行）；renderValue 自定义触发框里的已选内容，
// 子节点渲染函数自定义每个选项
import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, AvatarGroup, Field, Flex, Select, Small, Text } from '@vue-tsx-pro/ui';
import { watch } from 'vue';

interface Member {
  id: string;
  name: string;
  role: string;
}

const directory: Member[] = [
  { id: 'zyh', name: '周一航', role: '设计' },
  { id: 'xy', name: '许悠', role: '设计' },
  { id: 'lxm', name: '林小满', role: '前端' },
  { id: 'zhr', name: '赵浩然', role: '前端' },
  { id: 'cm', name: '陈默', role: '后端' },
  { id: 'wq', name: '王晴', role: '测试' },
];

export default _component(() => {
  let open = _state(false);
  let loading = _state(false);
  let members = _state<Member[]>([]);
  let picked = _state<string[]>([]);

  watch(
    () => open,
    (isOpen) => {
      if (!isOpen || members.length > 0 || loading) return;
      loading = true;
      setTimeout(() => {
        members = directory;
        loading = false;
      }, 900);
    },
  );

  return () => (
    <Field label="项目成员" description="第一次打开时才加载成员列表">
      <Select
        items={members}
        toOption={(member) => ({ value: member.id, label: member.name, group: member.role })}
        selectionMode="multiple"
        value={_bind(picked)}
        open={_bind(open)}
        loading={loading}
        clearable
        placeholder="添加成员"
        renderValue={(selected) =>
          selected.length > 0 ? (
            <Flex align="center" gap="sm">
              <AvatarGroup>
                {selected.slice(0, 3).map((member) => (
                  <Avatar key={member.id} name={member.name} size="xs" />
                ))}
              </AvatarGroup>
              <Text size="sm">
                {selected.length > 3
                  ? `${selected[0]!.name} 等 ${selected.length} 人`
                  : selected.map((member) => member.name).join('、')}
              </Text>
            </Flex>
          ) : null
        }
      >
        {(member) => (
          <Flex align="center" gap="sm">
            <Avatar name={member.name} size="sm" />
            <Flex direction="column">
              <Text size="sm">{member.name}</Text>
              <Small tone="muted">{member.role}</Small>
            </Flex>
          </Flex>
        )}
      </Select>
    </Field>
  );
});
