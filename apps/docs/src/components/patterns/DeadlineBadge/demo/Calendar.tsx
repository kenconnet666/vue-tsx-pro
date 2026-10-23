// 开始日加几个工作日，按工作日历跳过节假日：验证完成后 10 个工作日内认定，中间有国庆长假
import { _component } from '@vue-tsx-pro/tsx';
import { createWorkCalendar, Flex, Provider, Small } from '@vue-tsx-pro/ui';
import { DeadlineBadge } from '@vue-tsx-pro/ui/patterns';

const calendar = createWorkCalendar({
  holidays: [['2026-10-01', '2026-10-08']],
  workdays: ['2026-09-27', '2026-10-10'],
});

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    <Flex align="center" justify="between" gap="md">
      <Small tone="muted">只按周末算</Small>
      <DeadlineBadge start="2026-09-28" workdays={10} today="2026-10-09" />
    </Flex>
    <Provider workCalendar={calendar}>
      <Flex align="center" justify="between" gap="md">
        <Small tone="muted">按工作日历（国庆放假、调休补班）</Small>
        <DeadlineBadge start="2026-09-28" workdays={10} today="2026-10-09" />
      </Flex>
    </Provider>
  </Flex>
));
