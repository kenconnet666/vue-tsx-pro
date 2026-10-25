import { ChartColumn, ClipboardList, Download, JapaneseYen, TrendingUp } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Badge,
  Button,
  Card,
  Field,
  Flex,
  Grid,
  H3,
  Select,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  downloadFile,
  useFormat,
  type StatusTone,
} from '@vue-tsx-pro/ui';
import { BarChart, LineChart } from '@vue-tsx-pro/ui/charts';
import { Globe } from '@vue-tsx-pro/ui/three';

type Status = 'draft' | 'done' | 'approved' | 'pending' | 'rejected';

interface Project {
  code: string;
  title: string;
  category: string;
  department: string;
  year: number;
  plannedSorties?: number;
  actualSorties?: number;
  planned?: number;
  actual?: number;
  status: Status;
}

const PROJECTS: Project[] = [
  {
    code: '项目 01',
    title: '机型 A 平尾翼梢整流罩设计优化',
    category: '设计优化',
    department: '结构设计部',
    year: 2026,
    planned: 272,
    actual: 438.4,
    status: 'draft',
  },
  {
    code: '项目 02',
    title: '机型 A 机身支架工艺优化',
    category: '工艺优化',
    department: '工艺研究所',
    year: 2026,
    plannedSorties: 40,
    actualSorties: 40,
    planned: 280,
    actual: 438.4,
    status: 'done',
  },
  {
    code: '项目 03',
    title: '机型 A 舱门密封件多货源',
    category: '多货源',
    department: '采购中心',
    year: 2026,
    plannedSorties: 30,
    actualSorties: 18,
    planned: 246,
    actual: 257.4,
    status: 'approved',
  },
  {
    code: '项目 04',
    title: '机型 A 客舱地板支撑件设计优化',
    category: '设计优化',
    department: '结构设计部',
    year: 2026,
    plannedSorties: 20,
    actualSorties: 12,
    planned: 252,
    actual: 214.56,
    status: 'approved',
  },
  {
    code: '项目 05',
    title: '机型 A 线束支架工艺优化',
    category: '工艺优化',
    department: '工艺研究所',
    year: 2026,
    plannedSorties: 35,
    planned: 157.5,
    status: 'pending',
  },
  {
    code: '项目 06',
    title: '机型 A 内饰连接件多货源',
    category: '多货源',
    department: '采购中心',
    year: 2026,
    plannedSorties: 50,
    planned: 160,
    status: 'rejected',
  },
  {
    code: '项目 07',
    title: '机型 B 起落架舱门工艺优化',
    category: '工艺优化',
    department: '工艺研究所',
    year: 2025,
    plannedSorties: 24,
    actualSorties: 24,
    planned: 190,
    actual: 205.3,
    status: 'done',
  },
];

/** 每月的 [预期, 实际]（万元） */
const MONTHLY = [
  [120, 40],
  [120, 70],
  [170, 150],
  [190, 205],
  [200, 180],
  [160, 150],
  [200, 185],
  [195, 150],
  [230, 190],
  [250, 205],
  [300, 270],
  [330, 360],
];
const MONTHS = MONTHLY.map(([planned, actual], index) => ({
  month: `${index + 1}月`,
  planned: planned!,
  actual: actual!,
}));

const STATUS: Record<Status, [label: string, tone: StatusTone]> = {
  draft: ['草稿', 'neutral'],
  done: ['已完成', 'info'],
  approved: ['已通过', 'success'],
  pending: ['待审核', 'warning'],
  rejected: ['已退回', 'danger'],
};

const SERIES = [
  { key: 'planned', label: '预期降本' },
  { key: 'actual', label: '实际降本' },
] as const;

/** 下拉里“全部”的值 */
const ALL = '';
const choices = (values: string[]) => [
  { value: ALL, label: '全部' },
  ...[...new Set(values)].map((value) => ({ value, label: value })),
];
const YEARS = [
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
];

/** 主要供应商：零部件运到上海的总装线 */
const ASSEMBLY = { city: '上海', lat: 31.23, lng: 121.47 };
const SUPPLIERS = [
  { city: '西安', part: '机身中段', lat: 34.34, lng: 108.94, share: 18 },
  { city: '成都', part: '机头', lat: 30.57, lng: 104.07, share: 12 },
  { city: '图卢兹', part: '航电系统', lat: 43.6, lng: 1.44, share: 15 },
  { city: '辛辛那提', part: '发动机', lat: 39.1, lng: -84.51, share: 26 },
  { city: '哈特福德', part: '起落架', lat: 41.76, lng: -72.68, share: 9 },
  { city: '名古屋', part: '复合材料', lat: 35.18, lng: 136.91, share: 7 },
];

const styles = css.create({
  filters: { display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '_md' },
  filter: { minWidth: '9em' },
  actions: { display: 'flex', gap: '_sm', marginInlineStart: 'auto' },
  globe: { maxWidth: '22rem', marginInline: 'auto' },
});

/** 统计分析：筛选、关键指标、两张图与明细表；点“查询”才按筛选条件刷新 */
export default _component(() => {
  const format = useFormat();
  const initial = { year: '2026', category: ALL, department: ALL };
  let draft = _state({ ...initial });
  let applied = _state({ ...initial });

  const rows = _derived(
    PROJECTS.filter(
      (project) =>
        String(project.year) === applied.year &&
        (applied.category === ALL || project.category === applied.category) &&
        (applied.department === ALL || project.department === applied.department),
    ),
  );
  const total = (key: 'planned' | 'actual') =>
    rows.reduce((sum, project) => sum + (project[key] ?? 0), 0);
  const money = (value?: number) =>
    value === undefined ? '—' : format.number(value, { minimumFractionDigits: 2 });

  function reset() {
    draft = { ...initial };
    applied = { ...initial };
  }

  function exportCsv() {
    const header = [
      '降本项目',
      '任务类别',
      '计划架次',
      '实际架次',
      '预期降本（万元）',
      '实际降本（万元）',
      '状态',
    ];
    const lines = rows.map((project) => [
      `${project.code} ${project.title}`,
      project.category,
      project.plannedSorties ?? '',
      project.actualSorties ?? '',
      project.planned ?? '',
      project.actual ?? '',
      STATUS[project.status][0],
    ]);
    // 开头的 BOM 让 Excel 按 UTF-8 打开，中文不乱码
    const csv = `\uFEFF${[header, ...lines].map((line) => line.join(',')).join('\n')}`;
    downloadFile('降本统计.csv', csv, 'text/csv');
  }

  return () => {
    const planned = total('planned');
    const actual = total('actual');
    return (
      <Flex direction="column" gap="md">
        <Card>
          <div {...css.attrs(styles.filters)}>
            <Field label="统计年度" sx={styles.filter}>
              <Select items={YEARS} _value={draft.year} />
            </Field>
            <Field label="任务类别" sx={styles.filter}>
              <Select
                items={choices(PROJECTS.map((project) => project.category))}
                _value={draft.category}
              />
            </Field>
            <Field label="提出部门" sx={styles.filter}>
              <Select
                items={choices(PROJECTS.map((project) => project.department))}
                _value={draft.department}
              />
            </Field>
            <div {...css.attrs(styles.actions)}>
              <Button onClick={() => (applied = { ...draft })}>查询</Button>
              <Button variant="outline" tone="neutral" onClick={reset}>
                重置
              </Button>
            </div>
          </div>
        </Card>

        <Grid minItemWidth="12em" gap="md">
          <Card>
            <Stat label="降本项目总数" value={rows.length} unit="项" icon={ClipboardList} />
          </Card>
          <Card>
            <Stat
              label="预期降本金额"
              value={planned}
              format={{ minimumFractionDigits: 2 }}
              unit="万元"
              icon={JapaneseYen}
            />
          </Card>
          <Card>
            <Stat
              label="实际降本金额"
              value={actual}
              format={{ minimumFractionDigits: 2 }}
              unit="万元"
              icon={ChartColumn}
            />
          </Card>
          <Card>
            <Stat
              label="降本达成率"
              value={planned ? actual / planned : 0}
              format={{ style: 'percent', maximumFractionDigits: 1 }}
              icon={TrendingUp}
            />
          </Card>
        </Grid>

        <Grid minItemWidth="22em" gap="md">
          <Card header={<H3 size="md">项目降本金额</H3>}>
            <BarChart
              aria-label="项目降本金额"
              data={rows}
              index="code"
              series={[...SERIES]}
              unit="万元"
              valueFormat={{ maximumFractionDigits: 2 }}
            />
          </Card>
          <Card header={<H3 size="md">月度降本趋势</H3>}>
            <LineChart
              aria-label="月度降本趋势"
              data={MONTHS}
              index="month"
              series={[...SERIES]}
              unit="万元"
              dots="hollow"
            />
          </Card>
        </Grid>

        <Card header={<H3 size="md">供应商分布</H3>}>
          <Grid minItemWidth="18em" gap="lg" align="center">
            <Globe
              markers={[ASSEMBLY, ...SUPPLIERS].map(({ lat, lng }, index) => ({
                lat,
                lng,
                size: index === 0 ? 1.5 : 1,
              }))}
              arcs={SUPPLIERS.map(({ lat, lng }) => ({
                from: [lat, lng],
                to: [ASSEMBLY.lat, ASSEMBLY.lng],
              }))}
              center={{ lat: 35, lng: 60 }}
              sx={styles.globe}
            />
            <Table aria-label="主要供应商" density="compact">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>所在地</TableHeaderCell>
                  <TableHeaderCell>部件</TableHeaderCell>
                  <TableHeaderCell align="end">采购占比</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {SUPPLIERS.map((supplier) => (
                  <TableRow key={supplier.city}>
                    <TableHeaderCell>{supplier.city}</TableHeaderCell>
                    <TableCell>{supplier.part}</TableCell>
                    <TableCell align="end">{supplier.share}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Grid>
        </Card>

        <Card
          header={
            <Flex align="center" justify="between" gap="sm">
              <H3 size="md">项目统计明细</H3>
              <Button
                size="sm"
                variant="outline"
                tone="neutral"
                icon={Download}
                onClick={exportCsv}
              >
                导出统计
              </Button>
            </Flex>
          }
        >
          <Table aria-label="项目统计明细">
            <TableHead>
              <TableRow>
                <TableHeaderCell>降本项目</TableHeaderCell>
                <TableHeaderCell>任务类别</TableHeaderCell>
                <TableHeaderCell align="end">计划架次</TableHeaderCell>
                <TableHeaderCell align="end">实际架次</TableHeaderCell>
                <TableHeaderCell align="end">预期降本（万元）</TableHeaderCell>
                <TableHeaderCell align="end">实际降本（万元）</TableHeaderCell>
                <TableHeaderCell>状态</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((project) => (
                <TableRow key={project.code}>
                  <TableCell>{`${project.code} · ${project.title}`}</TableCell>
                  <TableCell nowrap>{project.category}</TableCell>
                  <TableCell align="end">{project.plannedSorties ?? '—'}</TableCell>
                  <TableCell align="end">{project.actualSorties ?? '—'}</TableCell>
                  <TableCell align="end">{money(project.planned)}</TableCell>
                  <TableCell align="end">{money(project.actual)}</TableCell>
                  <TableCell nowrap>
                    <Badge tone={STATUS[project.status][1]}>{STATUS[project.status][0]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </Flex>
    );
  };
});
