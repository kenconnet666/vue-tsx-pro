// 协商的逐条回应（只读）：供应商每一条异议下面是财务部的回应，回应的结论（采纳 / 不采纳）与改了的字段放在 extra；
// 不给 onSend 时没有输入框与回复按钮
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Badge, Card, FieldCompare, Flex, type CompareField } from '@zerodep-dev/vue-tsx-pro-ui';
import { CommentThread, type CommentItem } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

interface Estimate {
  unitPrice: number;
  scrapRate: number;
}

const fields: CompareField<Estimate>[] = [
  { key: 'unitPrice', header: '单价', type: 'currency', better: 'lower' },
  { key: 'scrapRate', header: '废品率', type: 'percent', better: 'lower' },
];

/** 回应的结论与改了的字段 */
const verdict = (accepted: boolean, before?: Estimate, after?: Estimate) => (
  <Flex direction="column" gap="xs" align="start">
    <Badge tone={accepted ? 'success' : 'neutral'} size="sm">
      {accepted ? '采纳' : '不采纳'}
    </Badge>
    {before && after && (
      <FieldCompare fields={fields} before={before} after={after} layout="list" />
    )}
  </Flex>
);

const v2: Estimate = { unitPrice: 119.35, scrapRate: 0.032 };
const v3: Estimate = { unitPrice: 116.8, scrapRate: 0.025 };

const comments: CommentItem[] = [
  {
    id: 'o1',
    author: '华辰-李工',
    role: (
      <Badge tone="warning" size="sm">
        第 1 轮异议
      </Badge>
    ),
    content: '废品率按 3.2% 偏高，我们产线近 6 个月平均 2.5%，统计表见附件。',
    time: '2026-10-19T10:20:00+08:00',
    attachments: [{ name: '近 6 个月废品统计.xlsx', url: '#', size: 52_000 }],
    replies: [
      {
        id: 'r1',
        author: '方圆',
        role: <Badge size="sm">财务部</Badge>,
        content: '核对过统计表，按 2.5% 重新测算，单价随之调整。',
        time: '2026-10-20T15:02:00+08:00',
        extra: verdict(true, v2, v3),
      },
    ],
  },
  {
    id: 'o2',
    author: '华辰-李工',
    role: (
      <Badge tone="warning" size="sm">
        第 1 轮异议
      </Badge>
    ),
    content: '模具摊销按 3 年太短，建议按 5 年摊。',
    time: '2026-10-19T10:26:00+08:00',
    replies: [
      {
        id: 'r2',
        author: '方圆',
        role: <Badge size="sm">财务部</Badge>,
        content: '该零件的项目寿命只有 3 年，摊销年限不能超过项目寿命，维持原测算。',
        time: '2026-10-20T15:10:00+08:00',
        extra: verdict(false),
      },
    ],
  },
];

export default _component(() => () => (
  <Card>
    <CommentThread comments={comments} now={Date.parse('2026-10-24T09:00:00+08:00')} />
  </Card>
));
