import { AtSign } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, Button, CommandPalette, Flex, Small, Text } from '@vue-tsx-pro/ui';

interface Person {
  id: string;
  name: string;
  email: string;
  team: string;
}

const people: Person[] = [
  { id: 'zyh', name: '周一航', email: 'yihang@example.com', team: '设计中心' },
  { id: 'lxm', name: '林小满', email: 'xiaoman@example.com', team: '前端' },
  { id: 'cm', name: '陈默', email: 'chenmo@example.com', team: '后端' },
  { id: 'xy', name: '许悠', email: 'xuyou@example.com', team: '产品' },
  { id: 'wq', name: '王晴', email: 'wangqing@example.com', team: '市场' },
  { id: 'zhr', name: '赵浩然', email: 'haoran@example.com', team: '前端' },
];

export default _component(() => {
  let mentioned = _state<Person | undefined>();
  return () => (
    <Flex direction="column" gap="md" align="start">
      <CommandPalette
        items={people}
        toOption={(person) => ({ value: person.id, label: person.name, group: person.team })}
        // 姓名、邮箱都能搜
        filter={(person, query) =>
          person.name.includes(query) || person.email.toLowerCase().includes(query.toLowerCase())
        }
        hotkey={false}
        label="提及成员"
        placeholder="输入姓名或邮箱"
        trigger={(props) => (
          <Button {...props} variant="soft" icon={AtSign}>
            提及成员
          </Button>
        )}
        renderOption={(person) => (
          <Flex align="center" gap="sm">
            <Avatar size="sm" name={person.name} />
            <Flex direction="column" grow>
              <Text>{person.name}</Text>
              <Small tone="muted">{person.email}</Small>
            </Flex>
          </Flex>
        )}
        onAction={(person) => (mentioned = person)}
      />
      <Small tone="muted">
        {mentioned ? `已提及 @${mentioned.name}（${mentioned.team}）` : '还没有提及谁'}
      </Small>
    </Flex>
  );
});
