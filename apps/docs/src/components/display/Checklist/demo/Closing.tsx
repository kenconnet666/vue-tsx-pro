// 项目结项前的清单：里程碑带完成日期与交付证据，超时的标红并给“催办”；结项材料写清缺的由谁出具。
// summary 在上面显示完成数与进度条，不适用的不算
import { BellRing, Paperclip, Upload } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Button,
  Card,
  Checklist,
  Grid,
  H3,
  Icon,
  Link,
  type ChecklistItem,
} from '@vue-tsx-pro/ui';

const evidence = (name: string) => (
  <Link href="#">
    <Icon icon={Paperclip} /> {name}
  </Link>
);

const milestones: ChecklistItem[] = [
  {
    label: '方案确定',
    status: 'done',
    owner: '方圆',
    date: '2026-08-12 完成',
    evidence: evidence('方案评审纪要.pdf'),
  },
  {
    label: '样品验收',
    status: 'done',
    owner: '林小满',
    date: '2026-09-20 完成',
    evidence: evidence('样品验收报告.pdf'),
  },
  {
    label: '批量切换',
    status: 'overdue',
    description: '生产线切换到新供应商的首批零件，附切换单',
    owner: '周宁',
    date: '计划 2026-10-15，已超 9 天',
    action: (
      <Button size="sm" variant="soft" tone="danger" icon={BellRing}>
        催办
      </Button>
    ),
  },
];

const closing: ChecklistItem[] = [
  { label: '验收报告', status: 'done', date: '2026-10-08', evidence: evidence('验收报告.pdf') },
  {
    label: '财务复核意见',
    description: '测算锁定后出具',
    owner: '由财务部出具',
    action: (
      <Button size="sm" variant="surface" icon={Upload}>
        上传
      </Button>
    ),
  },
  {
    label: '合同签订记录',
    status: 'blocked',
    description: '等财务复核意见：合同价格要按复核后的金额',
    owner: '由采购部出具',
  },
  { label: '海关备案', status: 'skipped', description: '国内供应商，不涉及' },
];

export default _component(() => () => (
  <Grid minItemWidth="22em" gap="lg">
    <Card header={<H3 size="sm">里程碑与交付证据</H3>}>
      <Checklist items={milestones} summary />
    </Card>
    <Card header={<H3 size="sm">结项材料</H3>} extra={<Badge tone="warning">缺 2 项</Badge>}>
      <Checklist items={closing} summary />
    </Card>
  </Grid>
));
