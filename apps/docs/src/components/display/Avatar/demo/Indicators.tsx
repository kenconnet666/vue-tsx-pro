import { Bell, Inbox, ListTodo, MessageCircle } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, Button, Flex, IconButton, Indicator, Text } from '@vue-tsx-pro/ui';
import { members } from './photos';

export default _component(() => {
  let unread = _state(8);
  return () => (
    <Flex direction="column" gap="lg">
      <Flex align="center" gap="lg" wrap>
        <Indicator count={unread}>
          <IconButton icon={Bell} variant="surface" aria-label="通知" />
        </Indicator>
        <Indicator count={120} max={99} tone="accent">
          <IconButton icon={Inbox} variant="surface" aria-label="收件箱" />
        </Indicator>
        <Indicator count={0} showZero tone="neutral">
          <IconButton icon={ListTodo} variant="surface" aria-label="待办" />
        </Indicator>
        <Indicator dot tone="warning" label="有新回复">
          <IconButton icon={MessageCircle} variant="surface" aria-label="评论" />
        </Indicator>
        <Button size="sm" variant="soft" onClick={() => unread++}>
          来一条消息
        </Button>
        <Button size="sm" variant="ghost" disabled={unread === 0} onClick={() => (unread = 0)}>
          全部已读
        </Button>
      </Flex>
      <Flex align="center" gap="lg" wrap>
        <Text size="xs" tone="muted">
          在线状态
        </Text>
        {members.slice(0, 4).map((member, index) => (
          <Indicator
            key={member.name}
            dot
            tone={index === 3 ? 'neutral' : index === 2 ? 'warning' : 'success'}
            placement="bottom-end"
            overlap="circular"
            label={index === 3 ? '离线' : index === 2 ? '忙碌' : '在线'}
          >
            <Avatar size="lg" name={member.name} src={member.src} />
          </Indicator>
        ))}
      </Flex>
    </Flex>
  );
});
