// 全屏：点顶栏右上角的按钮，顶栏和左侧栏都收起来，正文占满窗口；右上角的按钮或 Esc 退出
import { Box, FileText, House, Users } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  ColumnTable,
  Flex,
  H1,
  NavItem,
  NavList,
  Small,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { AppShell, AppShellBrand } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

// 全屏多用来对着一张大表工作：正文是一张合同台账
interface Contract {
  id: string;
  supplier: string;
  owner: string;
  amount: number;
  signed: string;
  status: string;
}

const contracts: Contract[] = [
  {
    id: 'HT-2026-031',
    supplier: '华辰精密',
    owner: '林小满',
    amount: 128000,
    signed: '2026-10-08',
    status: '执行中',
  },
  {
    id: 'HT-2026-030',
    supplier: '青禾线缆',
    owner: '周一航',
    amount: 86500,
    signed: '2026-10-02',
    status: '执行中',
  },
  {
    id: 'HT-2026-029',
    supplier: '北辰电子',
    owner: '陈默',
    amount: 245300,
    signed: '2026-09-25',
    status: '待验收',
  },
  {
    id: 'HT-2026-028',
    supplier: '恒通紧固件',
    owner: '许悠',
    amount: 6800,
    signed: '2026-09-18',
    status: '已完成',
  },
  {
    id: 'HT-2026-027',
    supplier: '远山钣金',
    owner: '王晴',
    amount: 57200,
    signed: '2026-09-11',
    status: '已完成',
  },
];

const columns: DataTableColumn<Contract>[] = [
  { key: 'id', header: '合同编号', width: 130 },
  { key: 'supplier', header: '供应商' },
  { key: 'owner', header: '负责人', width: 90 },
  { key: 'amount', header: '金额（元）', type: 'number', width: 120 },
  { key: 'signed', header: '签订日期', width: 120 },
  { key: 'status', header: '状态', width: 90 },
];

export default _component(() => {
  let fullscreen = _state(false);
  return () => (
    <AppShell
      _fullscreen={fullscreen}
      brand={
        <AppShellBrand href="#home" icon={Box}>
          采购协同
        </AppShellBrand>
      }
      header={<Small tone="muted">{fullscreen ? '全屏中' : '点右边的按钮进入全屏'}</Small>}
      sidebar={
        <NavList aria-label="导航">
          <NavItem href="#home" icon={House} active>
            工作台
          </NavItem>
          <NavItem href="#contracts" icon={FileText}>
            合同
          </NavItem>
          <NavItem href="#suppliers" icon={Users}>
            供应商
          </NavItem>
        </NavList>
      }
    >
      <Flex direction="column" gap="md">
        <H1>{fullscreen ? '合同台账（全屏）' : '合同台账'}</H1>
        <ColumnTable
          rows={contracts}
          columns={columns}
          getKey={(contract) => contract.id}
          aria-label="合同台账"
        />
      </Flex>
    </AppShell>
  );
});
