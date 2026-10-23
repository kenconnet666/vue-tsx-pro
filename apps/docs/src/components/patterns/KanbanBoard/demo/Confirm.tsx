// 招聘看板：放下后先确认（useFormDialog 填意见），确认了才改数据，取消就什么都不变；拖动中卡片换一种写法
import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, Badge, Flex, Small, Text } from '@vue-tsx-pro/ui';
import { KanbanBoard, useFormDialog, type KanbanColumn } from '@vue-tsx-pro/ui/patterns';

interface Candidate {
  id: string;
  name: string;
  role: string;
  years: number;
  source: string;
  stage: string;
  next?: string;
}

const columns: KanbanColumn[] = [
  { key: 'screen', label: '简历筛选' },
  { key: 'interview', label: '面试' },
  { key: 'offer', label: '录用', tone: 'success' },
  { key: 'rejected', label: '未通过', tone: 'danger' },
];
const label = (key: string) => columns.find((column) => column.key === key)!.label;

export default _component(() => {
  const prompt = useFormDialog();
  let candidates = _state<Candidate[]>([
    { id: 'c1', name: '韩亦舟', role: '前端工程师', years: 5, source: '内推', stage: 'screen' },
    { id: 'c2', name: '唐可', role: '测试工程师', years: 3, source: '招聘网站', stage: 'screen' },
    { id: 'c3', name: '白露', role: '数据分析师', years: 2, source: '校招', stage: 'screen' },
    {
      id: 'c4',
      name: '顾北辰',
      role: '产品经理',
      years: 7,
      source: '猎头',
      stage: 'interview',
      next: '10-22 14:00 二面',
    },
    {
      id: 'c5',
      name: '江屿',
      role: '后端工程师',
      years: 6,
      source: '内推',
      stage: 'interview',
      next: '10-23 10:00 终面',
    },
    {
      id: 'c6',
      name: '沈念',
      role: '交互设计师',
      years: 4,
      source: '招聘网站',
      stage: 'offer',
      next: '11-01 入职',
    },
    { id: 'c7', name: '叶舒', role: '前端工程师', years: 1, source: '校招', stage: 'rejected' },
  ]);
  let message = _state('拖一张卡片到别的阶段，确认后才移动');

  async function move(candidate: Candidate, to: string) {
    const values = await prompt({
      title: `${candidate.name}：${label(candidate.stage)} → ${label(to)}`,
      description: `${candidate.role} · ${candidate.years} 年经验`,
      confirmText: '确认移动',
      tone: to === 'rejected' ? 'danger' : 'accent',
      fields: [{ name: 'note', label: '意见', type: 'textarea', required: true }],
    });
    if (!values) {
      message = `${candidate.name} 没有移动`;
      return;
    }
    candidates = candidates.map((item) =>
      item.id === candidate.id ? { ...item, stage: to, next: undefined } : item,
    );
    message = `${candidate.name} 移到了“${label(to)}”：${values.note}`;
  }

  return () => (
    <Flex direction="column" gap="sm">
      <KanbanBoard
        aria-label="招聘进度"
        columns={columns}
        items={candidates}
        getKey={(candidate) => candidate.id}
        getColumn={(candidate) => candidate.stage}
        getLabel={(candidate) => candidate.name}
        onMove={(candidate, to) => void move(candidate, to)}
        columnWidth="14rem"
        columnHeight="24rem"
        empty="还没有人"
      >
        {(candidate, { dragging }) => (
          <Flex align="start" gap="sm">
            <Avatar name={candidate.name} size="sm" />
            <Flex direction="column" gap="xs" grow>
              <Flex align="center" justify="between" gap="sm">
                <Text size="sm" weight="medium">
                  {candidate.name}
                </Text>
                <Badge size="xs" variant="soft" tone="neutral">
                  {candidate.source}
                </Badge>
              </Flex>
              <Small tone="muted">
                {dragging ? '放到要去的阶段' : `${candidate.role} · ${candidate.years} 年`}
              </Small>
              {candidate.next && !dragging && <Small tone="info">{candidate.next}</Small>}
            </Flex>
          </Flex>
        )}
      </KanbanBoard>
      <Small tone="muted" aria-live="polite">
        {message}
      </Small>
    </Flex>
  );
});
