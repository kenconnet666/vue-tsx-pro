import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Badge, Flex, Timeline } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Timeline
    alternate
    items={[
      {
        title: (
          <Flex align="center" gap="xs">
            v2.4.0{' '}
            <Badge tone="accent" size="xs">
              最新
            </Badge>
          </Flex>
        ),
        time: '2026-10-20',
        tone: 'accent',
        description: '十二套内置主题、日期组件第 1 层、3D 效果。',
      },
      {
        title: 'v2.3.0',
        time: '2026-09-02',
        tone: 'success',
        description: '表单 schema 推出字段约束。',
      },
      {
        title: 'v2.2.1',
        time: '2026-08-11',
        tone: 'warning',
        description: '修复 Safari 下弹层闪烁。',
      },
      { title: 'v2.2.0', time: '2026-07-25', description: '虚拟列表与树组件。' },
      {
        title: 'v2.0.0',
        time: '2026-05-30',
        tone: 'danger',
        description: '破坏性变更：符文改名。',
      },
    ]}
  />
));
