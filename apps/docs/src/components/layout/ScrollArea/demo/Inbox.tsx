import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Avatar,
  Card,
  Flex,
  FlexList,
  ScrollArea,
  Small,
  Strong,
  Text,
} from '@zerodep-dev/vue-tsx-pro-ui';

const senders = ['林小满', '周一航', '陈默', '许悠', '王晴', '赵浩然', '孙思远', '李雨桐'];
const subjects = [
  '首页改版的设计稿更新了，麻烦看一下',
  '下周一的评审会改到下午三点',
  '发票已经寄出，单号见附件',
  '接口文档补好了，有问题随时找我',
  '团建报名今天截止',
  '服务器续费提醒',
];

const messages = Array.from({ length: 24 }, (_, index) => ({
  id: index,
  sender: senders[index % senders.length]!,
  subject: subjects[index % subjects.length]!,
  time: `${String(18 - Math.floor(index / 3)).padStart(2, '0')}:${String((index * 17) % 60).padStart(2, '0')}`,
}));

const styles = css.create({
  area: { height: '20rem' },
  item: { paddingBlock: '_sm', paddingInline: '_md' },
});

export default _component(() => () => (
  <Card padding="none">
    <ScrollArea sx={styles.area} propsViewport={{ 'aria-label': '收件箱' }}>
      <FlexList direction="column">
        {messages.map((message) => (
          <li key={message.id}>
            <Flex gap="md" align="center" sx={styles.item}>
              <Avatar size="sm" name={message.sender} />
              <Flex direction="column" grow>
                <Flex justify="between" gap="sm">
                  <Strong>{message.sender}</Strong>
                  <Small tone="muted">{message.time}</Small>
                </Flex>
                <Text size="sm" tone="muted" truncate>
                  {message.subject}
                </Text>
              </Flex>
            </Flex>
          </li>
        ))}
      </FlexList>
    </ScrollArea>
  </Card>
));
