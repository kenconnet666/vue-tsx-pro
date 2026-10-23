import { Megaphone, Pause, Play } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, Icon, IconButton, Marquee, Text } from '@vue-tsx-pro/ui';

const notices = [
  '10 月 25 日 02:00–04:00 系统维护，期间暂停下单',
  '双十一预售今晚 20:00 开始，定金立减 50 元',
  '新增顺丰次日达，覆盖 120 个城市',
  '客服热线工作时间调整为 8:00–22:00',
];

const styles = stylex.create({
  notice: { flexGrow: 1, height: '1.5em' },
  accent: { color: '_accentText' },
});

export default _component(() => {
  let paused = _state(false);
  return () => (
    <Card padding="sm">
      <Flex align="center" gap="sm">
        <Icon icon={Megaphone} sx={styles.accent} />
        <Marquee
          direction="up"
          speed={20}
          gap="sm"
          paused={paused}
          aria-label="公告"
          sx={styles.notice}
        >
          {notices.map((notice) => (
            <Text key={notice}>{notice}</Text>
          ))}
        </Marquee>
        <IconButton
          icon={paused ? Play : Pause}
          aria-label={paused ? '继续滚动' : '暂停滚动'}
          onClick={() => (paused = !paused)}
        />
      </Flex>
    </Card>
  );
});
