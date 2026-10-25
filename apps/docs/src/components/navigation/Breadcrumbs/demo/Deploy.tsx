import { _component } from '@vue-tsx-pro/tsx';
import { Steps } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Steps
    orientation="vertical"
    size="sm"
    _current={2}
    items={[
      { title: '拉取代码', description: 'main@3f9c2e1 · 12 秒' },
      { title: '安装依赖', description: 'pnpm install · 41 秒' },
      { title: '运行测试', description: '978 个通过，2 个失败', status: 'error' },
      { title: '构建', description: '等待测试通过' },
      { title: '发布到生产环境', description: '需要审批', disabled: true },
    ]}
  />
));
