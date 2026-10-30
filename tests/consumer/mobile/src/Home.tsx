// 只用发布包：移动端组件、主题 token、图标与符文。H5（main.ts）与两端小程序（app.ts）共用这一页
import { Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Cell, CellGroup, ConfigProvider } from '@zerodep-dev/vue-tsx-pro-mobile';

export const Home = _component(() => {
  let count = _state(0);
  return () => (
    <ConfigProvider>
      <CellGroup title="使用方">
        <Cell title="计数" value={String(count)} class="count-cell" />
      </CellGroup>
      <Button class="count" icon={Plus} onClick={() => count++}>
        加一
      </Button>
    </ConfigProvider>
  );
});
