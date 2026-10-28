/** 待办（首页）：等我处理的（收件箱里的可以认领）与我发起的 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Flex,
  FlexList,
  H1,
  H2,
  Link,
  Paragraph,
  Small,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { actions, usePageData } from '../client.ts';

/** 实例状态的文字 */
const STATUS: Record<string, string> = {
  active: '进行中',
  completed: '已完成',
  terminated: '已终止',
  withdrawn: '已撤回',
  suspended: '已暂停',
};

export default _component(() => {
  const data = usePageData('/');
  let busy = _state(false);

  async function claim(id: number) {
    busy = true;
    try {
      await actions.claim({ workItem: id });
      await data.reload();
    } finally {
      busy = false;
    }
  }

  return () => (
    <Flex direction="column" gap="lg">
      <H1>待办</H1>
      {data.value && data.value.todo.length === 0 && <Paragraph>没有待办。</Paragraph>}
      <FlexList direction="column" gap="sm" aria-label="待办列表">
        {data.value?.todo.map((item) => (
          <li key={item.id}>
            <Flex align="center" gap="md">
              <Link href={`/instances/${item.instanceId}`}>
                {item.title ?? `审批单 ${item.instanceId}`}
              </Link>
              <Small>{item.node}</Small>
              {item.claimable && (
                <Button
                  size="sm"
                  variant="soft"
                  disabled={busy}
                  onClick={() => void claim(item.id)}
                >
                  认领
                </Button>
              )}
            </Flex>
          </li>
        ))}
      </FlexList>
      <H2>我发起的</H2>
      <FlexList direction="column" gap="sm" aria-label="我发起的">
        {data.value?.started.map((instance) => (
          <li key={instance.id}>
            <Flex align="center" gap="md">
              <Link href={`/instances/${instance.id}`}>
                {instance.title ?? `审批单 ${instance.id}`}
              </Link>
              <Small data-testid="status">{STATUS[instance.status] ?? instance.status}</Small>
            </Flex>
          </li>
        ))}
      </FlexList>
    </Flex>
  );
});
