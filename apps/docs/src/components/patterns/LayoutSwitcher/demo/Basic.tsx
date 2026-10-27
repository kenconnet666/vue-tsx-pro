// 布局偏好和切换按钮：不记进 localStorage（storageKey: false），这里只把当前的值写出来。
// 应用里把 layout 交给 AppShell 的 layout，按钮放在顶栏里（完整的页面见 AppShell 的“用户自选布局”）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, createLayoutPreference, Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { LayoutSwitcher } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

const layout = createLayoutPreference({
  storageKey: false,
  defaults: { mode: 'overlay', side: 'start' },
});

const sides = { start: '左侧', end: '右侧', top: '顶部', bottom: '底部' };

export default _component(() => () => (
  <Flex align="center" gap="sm">
    <LayoutSwitcher layout={layout} />
    <Small tone="muted">
      当前：
      {layout.mode === 'docked' ? '固定侧栏' : `抽屉，在${sides[layout.side]}`}（
      <Code>{`{ mode: '${layout.mode}', side: '${layout.side}' }`}</Code>）
    </Small>
  </Flex>
));
