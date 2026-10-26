// 各种状态：今天固定在 2026-10-21（周三），截止日不同；完成了的按完成那天算
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { DeadlineBadge } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

const TODAY = '2026-10-21';
const rows = [
  { label: '还早', due: '2026-11-04' },
  { label: '快到期（2 个工作日内）', due: '2026-10-23' },
  { label: '今天到期', due: TODAY },
  { label: '超时', due: '2026-10-15' },
  { label: '按时完成', due: '2026-10-20', done: '2026-10-19' },
  { label: '超时完成', due: '2026-10-14', done: '2026-10-20' },
];

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    {rows.map((row) => (
      <Flex key={row.label} align="center" justify="between" gap="md">
        <Small tone="muted">
          {row.label} · 截止 {row.due}
        </Small>
        <DeadlineBadge due={row.due} done={row.done} today={TODAY} />
      </Flex>
    ))}
  </Flex>
));
