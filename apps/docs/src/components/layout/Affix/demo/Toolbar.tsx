// 长列表上方的操作条：在滚动面板里往下滚时贴在顶部，贴住时有阴影；滚下去后右下角出现“回到顶部”
import { Download, Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Affix,
  BackTop,
  Badge,
  Button,
  Card,
  Flex,
  Small,
  Text,
} from '@zerodep-dev/vue-tsx-pro-ui';

const tasks = Array.from({ length: 30 }, (_, index) => ({
  code: `T-${String(101 + index).padStart(3, '0')}`,
  title: ['来料检验报告补录', '模具保养计划确认', '供应商对账', '工艺变更评审', '月度销售复盘'][
    index % 5
  ],
  owner: ['林小满', '周一航', '许悠', '韩笑'][index % 4],
}));

export default _component(() => {
  let stuck = _state(false);
  let panel = _state.raw<HTMLElement | null>(null);
  return () => (
    <Card padding="none">
      {/* 示例自己的滚动面板：sticky 相对它贴住，所以把它作为 target */}
      <div
        ref={(element: unknown) => (panel = element as HTMLElement | null)}
        style={{ height: '20rem', overflowY: 'auto', position: 'relative' }}
      >
        <Flex direction="column" gap="xs" style={{ padding: '0 0.75em 0.75em' }}>
          <Small tone="muted" style={{ paddingBlock: '0.75em' }}>
            往下滚：操作条会贴在面板顶部
          </Small>
          <Affix target={() => panel} onChange={(next) => (stuck = next)}>
            <Card padding="sm">
              <Flex align="center" justify="between" gap="sm" wrap>
                <Flex align="center" gap="sm">
                  <Text weight="semibold">待办任务</Text>
                  <Badge size="xs" variant="soft">
                    {tasks.length}
                  </Badge>
                  {stuck && <Small tone="muted">已贴住</Small>}
                </Flex>
                <Flex gap="xs">
                  <Button size="sm" variant="ghost" tone="neutral" icon={Download}>
                    导出
                  </Button>
                  <Button size="sm" icon={Plus}>
                    新建任务
                  </Button>
                </Flex>
              </Flex>
            </Card>
          </Affix>
          {tasks.map((task) => (
            <Flex key={task.code} align="center" gap="md" style={{ paddingInline: '0.75em' }}>
              <Text mono size="sm" tone="muted">
                {task.code}
              </Text>
              <Text size="sm">{task.title}</Text>
              <Small tone="muted" style={{ marginInlineStart: 'auto' }}>
                {task.owner}
              </Small>
            </Flex>
          ))}
        </Flex>
        {/* 面板滚下去之后视口右下角出现，点了把面板滚回顶部 */}
        <BackTop target={() => panel} threshold={200} />
      </div>
    </Card>
  );
});
