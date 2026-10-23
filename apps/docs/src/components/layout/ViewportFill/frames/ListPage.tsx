// 列表页：外壳的品牌（AppShellBrand）、占满到窗口底边（ViewportFill）、表格在里面滚动（DataTable flexible），分页贴着窗口底边
import { Plane, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  DataTable,
  Flex,
  Pagination,
  Small,
  TextField,
  ViewportFill,
  type DataTableColumn,
} from '@vue-tsx-pro/ui';
import { AppShellBrand, AppShell } from '@vue-tsx-pro/ui/patterns';

interface Row {
  code: string;
  name: string;
  team: string;
  amount: number;
}

const rows: Row[] = Array.from({ length: 40 }, (_, index) => ({
  code: `DJ-2026-ZT-${index + 1}`,
  name: ['液压管路卡箍设计优化', '襟翼滑轨罩工艺优化', '舱门铰链第二货源'][index % 3]!,
  team: ['总体技术', '复合材料', '起落架液压'][index % 3]!,
  amount: 2 + ((index * 37) % 300) / 10,
}));

const columns: DataTableColumn<Row>[] = [
  { key: 'code', header: '编码', width: 150 },
  { key: 'name', header: '项目名称', width: 240 },
  { key: 'team', header: '责任团队', width: 140 },
  { key: 'amount', header: '预期（万元）', width: 120, align: 'end' },
];

const styles = stylex.create({ main: { paddingBlock: '_md' } });

export default _component(() => {
  let page = _state(1);
  return () => (
    <AppShell
      brand={
        <AppShellBrand href="#" icon={Plane}>
          联合降本管理
        </AppShellBrand>
      }
      propsMain={{ sx: styles.main }}
    >
      <ViewportFill gap="md">
        <Flex align="center" gap="sm">
          <TextField icon={Search} placeholder="编码 / 名称" aria-label="关键字" />
          <Small tone="muted">表格按行数自己的高度，最多占到窗口底边，再多在表格里滚动</Small>
        </Flex>
        <DataTable
          rows={rows}
          columns={columns}
          getKey={(row) => row.code}
          aria-label="台账"
          flexible
        />
        <Flex justify="end">
          <Pagination aria-label="分页" page={_bind(page)} total={400} pageSize={40} />
        </Flex>
      </ViewportFill>
    </AppShell>
  );
});
