// 纵向滚动的收件箱：ItemList 放在限高的 ScrollArea 里，滚动条是浮层的、不占宽度；点一条打开（选中）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Avatar,
  Card,
  ItemList,
  ItemListItem,
  ScrollArea,
  Small,
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
});

export default _component(() => {
  let open = _state(0);
  return () => (
    <Card padding="none">
      <ScrollArea sx={styles.area} propsViewport={{ 'aria-label': '收件箱' }}>
        <ItemList divided inset="md">
          {messages.map((message) => (
            <ItemListItem
              key={message.id}
              start={<Avatar size="sm" name={message.sender} />}
              title={message.sender}
              description={message.subject}
              end={<Small tone="muted">{message.time}</Small>}
              selected={message.id === open}
              onSelect={() => (open = message.id)}
            />
          ))}
        </ItemList>
      </ScrollArea>
    </Card>
  );
});
