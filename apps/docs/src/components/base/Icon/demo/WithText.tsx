import { ArrowRight, Clock, ExternalLink, MapPin, Plus, Star, Users } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Badge, Button, Flex, Icon, Link, Paragraph, Text } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Flex gap="lg" wrap>
      <Text tone="muted">
        <Icon icon={MapPin} /> 上海·徐汇
      </Text>
      <Text tone="muted">
        <Icon icon={Clock} /> 3 分钟前
      </Text>
      <Text tone="muted">
        <Icon icon={Users} /> 128 人参与
      </Text>
    </Flex>
    <Paragraph>
      图标跟随文字的字号与颜色，和文字基线对齐；放在句子中间也不会撑高行距，
      <Link href="#">
        查看设计规范 <Icon icon={ExternalLink} />
      </Link>
      。
    </Paragraph>
    <Flex gap="sm" wrap align="center">
      <Button icon={Plus}>新建项目</Button>
      <Button variant="ghost" iconEnd={ArrowRight}>
        继续
      </Button>
      <Badge tone="warning" icon={Star}>
        精选
      </Badge>
    </Flex>
  </Flex>
));
