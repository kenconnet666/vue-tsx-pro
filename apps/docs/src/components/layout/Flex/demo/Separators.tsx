import { Eye, MessageSquare, ThumbsUp } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Avatar,
  Card,
  Flex,
  FlexList,
  H3,
  Icon,
  Paragraph,
  Separator,
  Small,
} from '@vue-tsx-pro/ui';

const stats = [
  { icon: Eye, label: '阅读', value: '3.2 万' },
  { icon: ThumbsUp, label: '赞', value: '1,284' },
  { icon: MessageSquare, label: '评论', value: '96' },
];

export default _component(() => () => (
  <Card>
    <Flex direction="column" gap="md">
      <H3 size="lg">用 StyleX 写一套主题系统</H3>
      <Flex align="center" gap="sm" wrap>
        <Avatar size="xs" name="周一航" />
        <Small>周一航</Small>
        <Separator orientation="vertical" />
        <Small tone="muted">10 月 18 日</Small>
        <Separator orientation="vertical" />
        <Small tone="muted">阅读约 8 分钟</Small>
      </Flex>
      <Separator />
      <Paragraph size="sm">
        defineVars 声明变量，createTheme 覆盖一组取值，套在任意子树上就能局部换肤；组件只认
        token，不写死颜色。
      </Paragraph>
      <Separator decorative={false} />
      <FlexList gap="lg" aria-label="互动数据">
        {stats.map((stat) => (
          <li key={stat.label}>
            <Flex align="center" gap="xs">
              <Icon icon={stat.icon} aria-hidden />
              <Small tone="muted">
                {stat.label} {stat.value}
              </Small>
            </Flex>
          </li>
        ))}
      </FlexList>
    </Flex>
  </Card>
));
