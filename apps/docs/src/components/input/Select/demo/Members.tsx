// 打开时才去取选项（load：请求期间列表里是骨架行）；renderValue 自定义触发框里的已选内容，
// 子节点渲染函数自定义每个选项
import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, AvatarGroup, Field, Flex, Select, Small, Text } from '@vue-tsx-pro/ui';

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

/** 假的成员接口：900 ms 后返回全部成员，关掉弹层（请求被取消）时中止 */
const fetchMembers = (_query: string, signal: AbortSignal) =>
  new Promise<Member[]>((resolve, reject) => {
    const timer = setTimeout(() => resolve(directory), 900);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

export default _component(() => {
  let picked = _state<string[]>([]);

  return () => (
    <Field label="项目成员" description="打开时才加载成员列表">
      <Select
        load={fetchMembers}
        toOption={(member) => ({ value: member.id, label: member.name, group: member.role })}
        selectionMode="multiple"
        _value={picked}
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
