/**
 * 工作台（首页）：待办（收件箱里的可以认领，有时限的标出还剩几天、超时）、已办（选了什么、单子结束了没有）、
 * 抄送我的（没看过的标“未读”，打开审批单即已读）、我发起的；上面按流程筛选，页签上是条数
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  Button,
  Empty,
  Flex,
  H1,
  ItemList,
  ItemListItem,
  RelativeTime,
  Select,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { DeadlineBadge } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import type { VNodeChild } from 'vue';
import { actions, usePageData } from '../client.ts';

/** 实例状态的文字与色调 */
const STATUS: Record<string, [string, 'accent' | 'success' | 'neutral' | 'danger']> = {
  active: ['进行中', 'accent'],
  completed: ['已完成', 'success'],
  terminated: ['已终止', 'danger'],
  withdrawn: ['已撤回', 'neutral'],
  suspended: ['已暂停', 'neutral'],
};

const statusBadge = (status: string) => {
  const [text, tone] = STATUS[status] ?? [status, 'neutral'];
  return (
    <Badge variant="soft" tone={tone}>
      {text}
    </Badge>
  );
};

export default _component(() => {
  const data = usePageData('/');
  let tab = _state('todo');
  let process = _state<string | null>(null);
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

  /** 按选的流程筛 */
  const only = <T extends { processKey: string }>(rows: readonly T[] | undefined) =>
    (rows ?? []).filter((row) => process === null || row.processKey === process);

  /** 一个页签的列表：没有时显示空状态 */
  const list = (label: string, rows: readonly unknown[], items: () => VNodeChild) =>
    rows.length === 0 ? (
      <Empty size="sm" title={`没有${label}`} />
    ) : (
      <ItemList divided hoverable aria-label={label}>
        {items()}
      </ItemList>
    );

  return () => {
    const todo = only(data.value?.todo);
    const done = only(data.value?.done);
    const cc = only(data.value?.cc);
    const started = only(data.value?.started);
    const unread = cc.filter((item) => item.unread).length;
    return (
      <Flex direction="column" gap="lg">
        <Flex align="center" justify="between" gap="md" wrap>
          <H1>工作台</H1>
          <Select
            items={data.value?.processes ?? []}
            _value={process}
            placeholder="全部流程"
            clearable
            aria-label="按流程筛选"
          />
        </Flex>
        <Tabs _value={tab}>
          <TabList aria-label="工作台">
            <Tab value="todo">
              待办
              {todo.length > 0 && (
                <Badge tone="accent" radius="full">
                  {todo.length}
                </Badge>
              )}
            </Tab>
            <Tab value="done">已办</Tab>
            <Tab value="cc">
              抄送我的
              {unread > 0 && (
                <Badge tone="danger" radius="full">
                  {unread}
                </Badge>
              )}
            </Tab>
            <Tab value="started">我发起的</Tab>
          </TabList>
          <TabPanel value="todo">
            {list('待办', todo, () =>
              todo.map((item) => (
                <ItemListItem
                  key={item.id}
                  href={`/instances/${item.instanceId}`}
                  title={item.title ?? `审批单 ${item.instanceId}`}
                  description={`${item.process} · ${item.node}`}
                  end={
                    <Flex align="center" gap="sm">
                      {item.due && <DeadlineBadge due={item.due} today={data.value?.today} />}
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
                  }
                />
              )),
            )}
          </TabPanel>
          <TabPanel value="done">
            {list('已办', done, () =>
              done.map((item) => (
                <ItemListItem
                  key={item.id}
                  href={`/instances/${item.instanceId}`}
                  title={item.title ?? `审批单 ${item.instanceId}`}
                  description={
                    <>
                      {item.process} · {item.node}
                      {item.outcome && ` · ${item.outcome}`}
                      {item.completedAt && (
                        <>
                          {' · '}
                          <RelativeTime value={item.completedAt} />
                        </>
                      )}
                    </>
                  }
                  end={statusBadge(item.instanceStatus)}
                />
              )),
            )}
          </TabPanel>
          <TabPanel value="cc">
            {list('抄送', cc, () =>
              cc.map((item) => (
                <ItemListItem
                  key={item.id}
                  href={`/instances/${item.instanceId}`}
                  title={item.title ?? `审批单 ${item.instanceId}`}
                  description={[
                    item.process,
                    item.sender ? `${item.sender} 抄送` : '流程抄送',
                    item.message,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  end={
                    <Flex align="center" gap="sm">
                      {item.unread && (
                        <Badge variant="soft" tone="danger">
                          未读
                        </Badge>
                      )}
                      {statusBadge(item.status)}
                    </Flex>
                  }
                />
              )),
            )}
          </TabPanel>
          <TabPanel value="started">
            {list('我发起的', started, () =>
              started.map((instance) => (
                <ItemListItem
                  key={instance.id}
                  href={`/instances/${instance.id}`}
                  title={instance.title ?? `审批单 ${instance.id}`}
                  description={instance.process}
                  end={<span data-testid="status">{statusBadge(instance.status)}</span>}
                />
              )),
            )}
          </TabPanel>
        </Tabs>
      </Flex>
    );
  };
});
