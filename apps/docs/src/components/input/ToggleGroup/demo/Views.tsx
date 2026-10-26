import { CalendarDays, Columns3, LayoutGrid, List } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Small, ToggleGroup, ToggleItem } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let view = _state('board');
  let period = _state('week');
  return () => (
    <Flex direction="column" gap="lg">
      <Flex align="center" justify="between" gap="md" wrap>
        <ToggleGroup _value={view} required aria-label="视图">
          <ToggleItem value="list" icon={List}>
            列表
          </ToggleItem>
          <ToggleItem value="board" icon={Columns3}>
            看板
          </ToggleItem>
          <ToggleItem value="grid" icon={LayoutGrid}>
            卡片
          </ToggleItem>
          <ToggleItem value="calendar" icon={CalendarDays}>
            日历
          </ToggleItem>
        </ToggleGroup>
        <ToggleGroup _value={period} required size="sm" aria-label="时间范围">
          <ToggleItem value="day">日</ToggleItem>
          <ToggleItem value="week">周</ToggleItem>
          <ToggleItem value="month">月</ToggleItem>
          <ToggleItem value="year">年</ToggleItem>
        </ToggleGroup>
      </Flex>
      <Small tone="muted">
        {view} · {period}：required 时至少保留一项，再点已选项不会取消（分段控件）
      </Small>
    </Flex>
  );
});
