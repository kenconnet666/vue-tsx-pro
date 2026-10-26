// 列表页：外壳的品牌（AppShellBrand）、占满到窗口底边（ViewportFill）、表格在里面滚动（DataTable flexible），分页贴着窗口底边
import { Plane, Search } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  DataTable,
  Flex,
  Pagination,
  Small,
  TextField,
  ViewportFill,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { AppShellBrand, AppShell } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

interface Row {
  code: string;
  name: string;
  team: string;
  amount: number;
}

const rows: Row[] = Array.from({ length: 40 }, (_, index) => ({
  code: `PO-2026-${String(index + 1).padStart(4, '0')}`,
  name: ['线缆收纳夹改版', '桌面挡板流程优化', '机柜导轨第二供应商'][index % 3]!,
  team: ['技术部', '研发中心', '运营部'][index % 3]!,
  amount: 2 + ((index * 37) % 300) / 10,
}));

const columns: DataTableColumn<Row>[] = [
  { key: 'code', header: '编码', width: 150 },
  { key: 'name', header: '项目名称', width: 240 },
  { key: 'team', header: '责任团队', width: 140 },
  { key: 'amount', header: '预期（万元）', width: 120, align: 'end' },
];

const styles = css.create({ main: { paddingBlock: '_md' } });

export default _component(() => {
  let page = _state(1);
  return () => (
    <AppShell
      brand={
        <AppShellBrand href="#" icon={Plane}>
          采购管理平台
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
          <Pagination aria-label="分页" _page={page} total={400} pageSize={40} />
        </Flex>
      </ViewportFill>
    </AppShell>
  );
});
