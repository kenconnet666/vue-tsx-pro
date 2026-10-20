import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, AvatarGroup, Card, Flex, Small, Strong } from '@vue-tsx-pro/ui';
import { members } from './photos';

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Card>
      <Flex align="center" justify="between" gap="md" wrap>
        <Flex direction="column" gap="xs">
          <Strong>官网改版</Strong>
          <Small tone="muted">7 位协作者 · 2 小时前更新</Small>
        </Flex>
        <AvatarGroup max={4} aria-label="协作者">
          {members.map((member) => (
            <Avatar key={member.name} name={member.name} src={member.src} />
          ))}
        </AvatarGroup>
      </Flex>
    </Card>
    <Flex align="center" gap="lg" wrap>
      <AvatarGroup size="sm" max={3} total={128} aria-label="点赞的人">
        {members.slice(0, 3).map((member) => (
          <Avatar key={member.name} name={member.name} src={member.src} />
        ))}
      </AvatarGroup>
      <Small tone="muted">只拿到了 3 位，total 是 128：显示“+125”</Small>
    </Flex>
    <AvatarGroup size="lg" aria-label="评审人">
      {members.slice(1, 5).map((member) => (
        <Avatar key={member.name} name={member.name} src={member.src} />
      ))}
    </AvatarGroup>
  </Flex>
));
