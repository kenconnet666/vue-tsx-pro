// 报价单的操作记录：新的在前，每项有操作人（头像或首字母）与时间，改了哪些字段用 FieldCompare 列在项里；
// 完整的字段对比收在“查看详情”里。记录多，只显示最新的 4 条，其余在“展开其余 N 条”后面
import { FilePlus2, Pencil, Send, ShieldCheck, Undo2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  FieldCompare,
  Timeline,
  type CompareField,
  type TimelineItem,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { photo } from '../../Avatar/demo/photos';

/** 陆川有头像，其他人显示首字母 */
const luChuan = photo('#0ea5e9', '#6366f1');

interface Quote {
  unitPrice: number;
  quantity: number;
  leadDays: number;
  supplier: string;
  remark: string;
}

const fields: CompareField<Quote>[] = [
  { key: 'unitPrice', header: '单价', type: 'currency', better: 'lower' },
  { key: 'quantity', header: '数量', type: 'number' },
  { key: 'leadDays', header: '交期（天）', type: 'number', better: 'lower' },
  { key: 'supplier', header: '供应商' },
  { key: 'remark', header: '备注' },
];

const v1: Quote = {
  unitPrice: 86.5,
  quantity: 2_000,
  leadDays: 30,
  supplier: '华辰精密',
  remark: '含税含运',
};
const v2: Quote = { ...v1, unitPrice: 82, leadDays: 25 };
const v3: Quote = { ...v2, quantity: 2_400, remark: '含税含运，分两批交付' };
const v4: Quote = { ...v3, unitPrice: 79.8, supplier: '恒远五金' };

/** 一次修改：项里列改了的字段，详情里是全部字段的对比表 */
const change = (before: Quote, after: Quote) => ({
  description: <FieldCompare fields={fields} before={before} after={after} layout="list" />,
  details: (
    <FieldCompare
      fields={fields}
      before={before}
      after={after}
      propsTable={{ 'aria-label': '修改前后全部字段' }}
    />
  ),
});

const items: TimelineItem[] = [
  {
    key: '1',
    title: '创建报价单',
    actor: '周宁',
    time: '10-14 09:02',
    dateTime: '2026-10-14T09:02',
    icon: FilePlus2,
    tone: 'accent',
  },
  {
    key: '2',
    title: '修改报价',
    actor: '周宁',
    time: '10-14 15:40',
    dateTime: '2026-10-14T15:40',
    icon: Pencil,
    ...change(v1, v2),
  },
  {
    key: '3',
    title: '提交审批',
    actor: '周宁',
    time: '10-15 10:05',
    dateTime: '2026-10-15T10:05',
    icon: Send,
    tone: 'info',
  },
  {
    key: '4',
    title: '退回修改',
    actor: '陆川',
    avatar: luChuan,
    time: '10-16 11:20',
    dateTime: '2026-10-16T11:20',
    icon: Undo2,
    tone: 'warning',
    description: '数量按 Q4 排产计划补到 2,400，备注写明分批交付',
  },
  {
    key: '5',
    title: '修改报价',
    actor: '周宁',
    time: '10-16 16:48',
    dateTime: '2026-10-16T16:48',
    icon: Pencil,
    ...change(v2, v3),
  },
  {
    key: '6',
    title: '换供应商重新比价',
    actor: '方圆',
    time: '10-18 09:30',
    dateTime: '2026-10-18T09:30',
    icon: Pencil,
    ...change(v3, v4),
  },
  {
    key: '7',
    title: '审批通过',
    actor: '陆川',
    avatar: luChuan,
    time: '10-18 14:12',
    dateTime: '2026-10-18T14:12',
    icon: ShieldCheck,
    tone: 'success',
  },
];

export default _component(() => () => (
  <Card>
    <Timeline items={items} reverse maxVisible={4} />
  </Card>
));
