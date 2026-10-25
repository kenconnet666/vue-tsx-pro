// 页脚放快捷操作；fixedWeeks 让每个月都是六行，翻页时高度不跳；onPick 在每次点选时调用（再点已选的那天也会）
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Calendar, Card, Flex, Small, todayIso } from '@vue-tsx-pro/ui';

export default _component(() => {
  let date = _state<string | null>(null);
  let picks = _state(0);
  return () => (
    <Flex direction="column" gap="sm" align="start">
      <Card padding="sm">
        <Calendar
          _value={date}
          fixedWeeks
          defaultFocused="2026-12-01"
          onPick={() => picks++}
          aria-label="提醒日期"
          footer={
            <Flex gap="xs" justify="between">
              <Button size="sm" variant="ghost" tone="neutral" onClick={() => (date = todayIso())}>
                今天
              </Button>
              <Button
                size="sm"
                variant="ghost"
                tone="neutral"
                disabled={!date}
                onClick={() => (date = null)}
              >
                清空
              </Button>
            </Flex>
          }
        />
      </Card>
      <Small tone="muted">
        {date ?? '没有选择（一开始显示 2026 年 12 月）'} · 点选了 {picks} 次
      </Small>
    </Flex>
  );
});
