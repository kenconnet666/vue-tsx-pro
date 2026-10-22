// 三种排法：一项一行（补充信息靠结束边）、一行排开、只有图标（表格的格子里）
import { Paperclip } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Checklist,
  Flex,
  Icon,
  Small,
  ToggleGroup,
  ToggleItem,
  type ChecklistLayouts,
} from '@vue-tsx-pro/ui';

const milestones = [
  {
    label: '方案确定',
    done: true,
    extra: (
      <>
        <Small tone="muted">2026-08-13</Small>
        <Icon icon={Paperclip} aria-label="交付证据" />
      </>
    ),
  },
  { label: '验证完成', done: true, extra: <Small tone="muted">2026-09-22</Small> },
  { label: '收益确认', done: false, extra: <Small tone="muted">未完成</Small> },
];

export default _component(() => {
  let layout = _state<keyof ChecklistLayouts>('list');
  return () => (
    <Flex direction="column" gap="md">
      <ToggleGroup value={_bind(layout)} aria-label="排法" size="sm" required>
        <ToggleItem value="list">一项一行</ToggleItem>
        <ToggleItem value="inline">一行排开</ToggleItem>
        <ToggleItem value="icons">只有图标</ToggleItem>
      </ToggleGroup>
      <Checklist layout={layout} items={milestones} />
    </Flex>
  );
});
