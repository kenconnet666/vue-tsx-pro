// 模拟一个后台系统换页：点导航后加载条走起来，数据回来时走满淡出；“财务报表”那页会加载失败（危险色）。
// 加载条本来贴在窗口顶部（position: fixed），这里放进示例框的顶部，免得和文档站自己的加载条重叠
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { onScopeDispose, watch } from 'vue';
import {
  Badge,
  Button,
  Card,
  Flex,
  LoadingBar,
  Small,
  Tab,
  TabList,
  Tabs,
  Text,
  createLoadingBar,
} from '@zerodep-dev/vue-tsx-pro-ui';

const pages = [
  {
    id: 'orders',
    label: '订单列表',
    delay: 900,
    rows: ['SO-24101 华东仓 已发货', 'SO-24102 华南仓 待出库'],
  },
  {
    id: 'stock',
    label: '库存台账',
    delay: 1600,
    rows: ['A-12 轴承 312 件', 'B-07 密封圈 1 280 件'],
  },
  { id: 'report', label: '财务报表', delay: 1200, rows: [], fails: true },
  { id: 'quick', label: '个人设置', delay: 120, rows: ['通知：仅提及我', '语言：简体中文'] },
] as const;

export default _component(() => {
  const bar = createLoadingBar();
  let current = _state<string>('orders');
  let status = _state<'ready' | 'loading' | 'failed'>('ready');
  let timer: ReturnType<typeof setTimeout> | undefined;

  function load(id: string) {
    const page = pages.find((item) => item.id === id)!;
    clearTimeout(timer);
    status = 'loading';
    bar.start();
    timer = setTimeout(() => {
      status = 'fails' in page ? 'failed' : 'ready';
      if ('fails' in page) bar.error();
      else bar.finish();
    }, page.delay);
  }

  watch(() => current, load);
  onScopeDispose(() => clearTimeout(timer));
  const page = () => pages.find((item) => item.id === current)!;

  return () => (
    <Flex direction="column" gap="md">
      <Card padding="none" style={{ position: 'relative', overflow: 'hidden' }}>
        <LoadingBar controller={bar} style={{ position: 'absolute' }} />
        <Flex direction="column" gap="md" style={{ padding: '1em' }}>
          <Tabs _value={current}>
            <TabList aria-label="页面">
              {pages.map((item) => (
                <Tab key={item.id} value={item.id}>
                  {item.label}
                </Tab>
              ))}
            </TabList>
          </Tabs>
          <Flex
            direction="column"
            gap="xs"
            aria-busy={status === 'loading'}
            style={{ minHeight: '4.5em' }}
          >
            {status === 'loading' && <Small tone="muted">正在加载{page().label}…</Small>}
            {status === 'failed' && (
              <Flex align="center" gap="sm">
                <Badge tone="danger" variant="soft" size="xs">
                  加载失败
                </Badge>
                <Small tone="muted">服务器没有响应，请稍后重试</Small>
                <Button size="xs" variant="ghost" onClick={() => load(current)}>
                  重试
                </Button>
              </Flex>
            )}
            {status === 'ready' &&
              page().rows.map((row) => (
                <Text key={row} size="sm">
                  {row}
                </Text>
              ))}
          </Flex>
        </Flex>
      </Card>
      <Flex align="center" gap="sm" wrap>
        <Small tone="muted">手动控制：</Small>
        <Button size="sm" variant="soft" onClick={() => bar.start()}>
          start()
        </Button>
        <Button size="sm" variant="soft" onClick={() => bar.finish()}>
          finish()
        </Button>
        <Button size="sm" variant="soft" tone="danger" onClick={() => bar.error()}>
          error()
        </Button>
        <Small tone="muted">“个人设置”120ms 就好，不显示加载条</Small>
      </Flex>
    </Flex>
  );
});
