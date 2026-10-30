// 首页：H5（main.ts）与两端小程序（app.ts）共用这一份
import { Plus } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Cell,
  CellGroup,
  ConfigProvider,
  showToast,
} from '@zerodep-dev/vue-tsx-pro-mobile';

export const HomePage = _component(() => {
  let count = _state(0);
  return () => (
    <ConfigProvider theme="system">
      <CellGroup title="开始">
        <Cell title="计数" value={String(count)} />
        <Cell title="提示" arrow onClick={() => showToast('你好')} />
      </CellGroup>
      <Button icon={Plus} onClick={() => count++}>
        加一
      </Button>
    </ConfigProvider>
  );
});
