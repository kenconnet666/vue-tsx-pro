// 动态列表：发生时间写相对时间，随时间自动更新，悬停看完整的日期；一周以前的直接写日期
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Avatar, Card, Flex, RelativeTime, Small, Text } from '@vue-tsx-pro/ui';

const styles = stylex.create({
  list: { display: 'flex', flexDirection: 'column', gap: '_md', margin: 0, padding: 0 },
  item: { display: 'flex', alignItems: 'flex-start', gap: '_sm', listStyle: 'none' },
});

const MINUTE = 60_000;

export default _component(() => {
  // 演示数据：相对页面打开的时刻
  const opened = Date.now();
  const events = [
    { who: '林小满', what: '评论了“首页改版”', at: new Date(opened - 20_000) },
    { who: '周一航', what: '合并了 #1024', at: new Date(opened - 7 * MINUTE) },
    { who: '陈默', what: '把“支付回调”标为已解决', at: new Date(opened - 3 * 60 * MINUTE) },
    { who: '许悠', what: '创建了里程碑“v2.0”', at: new Date(opened - 26 * 60 * MINUTE) },
    { who: '王晴', what: '上传了设计稿', at: new Date(opened - 12 * 24 * 60 * MINUTE) },
  ];
  return () => (
    <Card padding="md">
      <ul {...stylex.attrs(styles.list)}>
        {events.map((event) => (
          <li key={event.who} {...stylex.attrs(styles.item)}>
            <Avatar size="sm" name={event.who} />
            <Flex direction="column">
              <Text>
                <Text weight="medium">{event.who}</Text> {event.what}
              </Text>
              <Small tone="muted">
                <RelativeTime value={event.at} threshold={{ days: 7 }} />
              </Small>
            </Flex>
          </li>
        ))}
      </ul>
    </Card>
  );
});
