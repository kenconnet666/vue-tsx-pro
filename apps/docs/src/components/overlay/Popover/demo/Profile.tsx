import { CalendarDays, MapPin } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Avatar,
  Button,
  Flex,
  HoverCard,
  Icon,
  Link,
  Paragraph,
  Small,
  Strong,
} from '@zerodep-dev/vue-tsx-pro-ui';

const people = {
  yihang: {
    name: '周一航',
    handle: '@yihang',
    bio: '交互设计师，做了八年工具类产品。喜欢把复杂的事讲简单。',
    city: '上海',
    joined: '2019 年加入',
    followers: '1,284',
  },
  xiaoman: {
    name: '林小满',
    handle: '@xiaoman',
    bio: '前端工程师，vue-tsx-pro 的维护者之一。',
    city: '杭州',
    joined: '2021 年加入',
    followers: '3,096',
  },
};

export default _component(() => {
  const mention = (key: keyof typeof people) => {
    const person = people[key];
    return (
      <HoverCard
        trigger={(props) => (
          <Link {...props} href={`#${key}`}>
            {person.handle}
          </Link>
        )}
      >
        <Flex direction="column" gap="sm">
          <Flex align="center" justify="between" gap="md">
            <Avatar name={person.name} />
            <Button size="sm" variant="soft">
              关注
            </Button>
          </Flex>
          <Flex direction="column">
            <Strong>{person.name}</Strong>
            <Small tone="muted">{person.handle}</Small>
          </Flex>
          <Paragraph size="sm">{person.bio}</Paragraph>
          <Flex gap="md" wrap>
            <Small tone="muted">
              <Icon icon={MapPin} /> {person.city}
            </Small>
            <Small tone="muted">
              <Icon icon={CalendarDays} /> {person.joined}
            </Small>
            <Small tone="muted">{person.followers} 关注者</Small>
          </Flex>
        </Flex>
      </HoverCard>
    );
  };
  return () => (
    <Paragraph>
      这一版的设计由 {mention('yihang')} 负责，组件实现与文档是 {mention('xiaoman')}{' '}
      做的。把指针停在名字上，或用 Tab 聚焦它，就能看到资料卡。
    </Paragraph>
  );
});
