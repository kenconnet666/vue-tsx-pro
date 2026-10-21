// 供应商降本建议：点行首的箭头展开详情（建议内容、影响评估、附件），草稿还没有内容，不能展开。
// 详情是表格里跨全部列的一行，横向滚动时贴着可见区域的起始边；expandedRows 可以双向绑定
import { Paperclip } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  createStatusMap,
  DataTable,
  Descriptions,
  Flex,
  Icon,
  Link,
  Small,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  reviewing: { label: '评估中', tone: 'info' },
  accepted: { label: '已采纳', tone: 'success' },
  rejected: { label: '未采纳', tone: 'danger' },
});

interface Proposal {
  code: string;
  supplier: string;
  part: string;
  kind: string;
  /** 预计单机降本（元） */
  saving: Decimal;
  status: string;
  content?: string;
  impact?: string;
  files?: string[];
  submitted?: string;
}

const proposals: Proposal[] = [
  {
    code: 'GYS-2026-031',
    supplier: '供应商甲',
    part: '整流罩支架',
    kind: '材料替代',
    saving: new Decimal('5600'),
    status: 'reviewing',
    content:
      '支架材料由 7050 铝合金改为 2024 铝合金，加工余量减少 30%，单件工时由 6.5 h 降到 4.8 h。',
    impact: '强度裕度由 1.42 降到 1.31，仍满足设计要求；需补做一项静力试验。',
    files: ['材料对比报告.pdf', '工时测算.xlsx'],
    submitted: '2026-10-08 张工',
  },
  {
    code: 'GYS-2026-034',
    supplier: '供应商乙',
    part: '舱门密封件',
    kind: '多货源',
    saving: new Decimal('2380.5'),
    status: 'accepted',
    content: '引入第二货源，年采购量 1,200 件分两家，单价由 186 元降到 162 元。',
    impact: '新货源需完成首件鉴定，预计 8 周。',
    files: ['报价单.pdf'],
    submitted: '2026-09-21 李工',
  },
  {
    code: 'GYS-2026-037',
    supplier: '供应商丙',
    part: '线束支架',
    kind: '工艺优化',
    saving: new Decimal('980'),
    status: 'rejected',
    content: '钣金件由数控铣改为冲压成形。',
    impact: '批量不足 500 件，模具费摊销后不降反升，未采纳。',
    submitted: '2026-09-15 王工',
  },
  {
    code: 'GYS-2026-040',
    supplier: '供应商甲',
    part: '口盖',
    kind: '设计优化',
    saving: new Decimal('0'),
    status: 'draft',
  },
];

const styles = stylex.create({ file: { color: '_textMuted' } });

const columns: DataTableColumn<Proposal>[] = [
  { key: 'code', header: '建议编号', width: 132, sticky: 'start' },
  { key: 'supplier', header: '供应商', width: 112 },
  { key: 'part', header: '零件', width: 140 },
  { key: 'kind', header: '类型', width: 104 },
  {
    key: 'saving',
    header: '预计单机降本（元）',
    width: 156,
    format: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  },
  { key: 'status', header: '状态', width: 112, statuses },
];

function detail(proposal: Proposal) {
  return (
    <Descriptions
      columns={2}
      size="sm"
      items={[
        { label: '建议内容', value: proposal.content, span: 2 },
        { label: '影响评估', value: proposal.impact, span: 2 },
        {
          label: '附件',
          value: proposal.files?.length ? (
            <Flex gap="md" wrap>
              {proposal.files.map((file) => (
                <Flex key={file} inline align="center" gap="xs">
                  <Icon icon={Paperclip} sx={styles.file} />
                  <Link href="#">{file}</Link>
                </Flex>
              ))}
            </Flex>
          ) : (
            <Small tone="muted">无</Small>
          ),
        },
        { label: '提交', value: proposal.submitted },
      ]}
    />
  );
}

export default _component(() => {
  let expanded = _state<string[]>(['GYS-2026-031']);
  return () => (
    <DataTable
      rows={proposals}
      columns={columns}
      rowKey={(proposal) => proposal.code}
      renderDetail={detail}
      hasDetail={(proposal) => proposal.content != null}
      expandedRows={_bind(expanded)}
      aria-label="供应商降本建议"
    />
  );
});
