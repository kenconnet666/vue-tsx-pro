// 动态列表：发生时间写相对时间，随时间自动更新，悬停看完整的日期；一周以前的直接写日期。
// format 是详略：long “3 分钟前”、short、narrow（窄栏、移动端）
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Avatar,
  Card,
  Flex,
  RelativeTime,
  Small,
  Text,
  ToggleGroup,
  ToggleItem,
} from '@vue-tsx-pro/ui';

const styles = css.create({
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
  let format = _state<Intl.RelativeTimeFormatStyle>('long');
  return () => (
    <Flex direction="column" gap="md">
      <ToggleGroup value={_bind(format)} required aria-label="详略" size="sm">
        <ToggleItem value="long">long</ToggleItem>
        <ToggleItem value="short">short</ToggleItem>
        <ToggleItem value="narrow">narrow</ToggleItem>
      </ToggleGroup>
      <Card padding="md">
        <ul {...css.attrs(styles.list)}>
          {events.map((event) => (
            <li key={event.who} {...css.attrs(styles.item)}>
              <Avatar size="sm" name={event.who} />
              <Flex direction="column">
                <Text>
                  <Text weight="medium">{event.who}</Text> {event.what}
                </Text>
                <Small tone="muted">
                  <RelativeTime value={event.at} format={format} threshold={{ days: 7 }} />
                </Small>
              </Flex>
            </li>
          ))}
        </ul>
      </Card>
    </Flex>
  );
});
