import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Dialog,
  Flex,
  KanbanBoard,
  Small,
  Text,
  Textarea,
  type KanbanColumn,
} from '@vue-tsx-pro/ui';

interface Candidate {
  id: string;
  name: string;
  role: string;
  stage: string;
}

const columns: KanbanColumn[] = [
  { key: 'screen', label: '简历筛选' },
  { key: 'interview', label: '面试' },
  { key: 'offer', label: '录用' },
  { key: 'rejected', label: '未通过', tone: 'danger' },
];

export default _component(() => {
  let candidates = _state<Candidate[]>([
    { id: 'c1', name: '韩亦舟', role: '前端工程师', stage: 'screen' },
    { id: 'c2', name: '唐可', role: '测试工程师', stage: 'screen' },
    { id: 'c3', name: '顾北辰', role: '产品经理', stage: 'interview' },
  ]);
  // 放下后先确认：要填意见的移动，在对话框里完成后才改数据
  let pending = _state<{ candidate: Candidate; to: string } | null>(null);
  let note = _state('');

  function confirm() {
    const { candidate, to } = pending!;
    candidates = candidates.map((item) =>
      item.id === candidate.id ? { ...item, stage: to } : item,
    );
    pending = null;
    note = '';
  }

  return () => (
    <>
      <KanbanBoard
        aria-label="招聘进度"
        columns={columns}
        items={candidates}
        getKey={(candidate) => candidate.id}
        getColumn={(candidate) => candidate.stage}
        getLabel={(candidate) => candidate.name}
        onMove={(candidate, to) => (pending = { candidate, to })}
        columnWidth="12rem"
        columnHeight="16rem"
        empty="还没有人"
      >
        {(candidate, { dragging }) => (
          <Flex direction="column">
            <Text size="sm" weight="medium">
              {candidate.name}
            </Text>
            <Small tone="muted">{dragging ? '放到要去的阶段' : candidate.role}</Small>
          </Flex>
        )}
      </KanbanBoard>
      <Dialog
        open={_bind(
          () => pending != null,
          (open: boolean) => {
            if (!open) pending = null;
          },
        )}
        title={
          pending &&
          `${pending.candidate.name} → ${columns.find((column) => column.key === pending!.to)!.label}`
        }
        footer={
          <Flex justify="end" gap="sm">
            <Button variant="ghost" tone="neutral" onClick={() => (pending = null)}>
              取消
            </Button>
            <Button disabled={!note.trim()} onClick={confirm}>
              确认
            </Button>
          </Flex>
        }
      >
        <Textarea value={_bind(note)} rows={3} placeholder="写一句意见" aria-label="意见" />
      </Dialog>
    </>
  );
});
