// 抽屉式侧栏（sidebarMode="overlay"）：导航盖在页面上面，开不开正文都是整宽；数据为主的工作台用它，表格不随侧栏变窄。
// 顶栏里品牌格之后是“打开”，抽屉顶上一格是“收起”；拖动抽屉的结束边调整宽度，双击回到初始宽度。数据是虚构的
import { Boxes, Gauge, Server, Settings, Siren, Wrench } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Avatar,
  createStatusMap,
  DataTable,
  Icon,
  NavItem,
  NavList,
  NavSection,
  Small,
  Tab,
  TabList,
  Tabs,
  type DataTableColumn,
  t,
} from '@vue-tsx-pro/ui';
import { AppShell } from '@vue-tsx-pro/ui/patterns';

const states = createStatusMap({
  running: { label: '运行中', tone: 'success' },
  warning: { label: '告警', tone: 'warning' },
  down: { label: '停机', tone: 'danger' },
  maintenance: { label: '保养中', tone: 'info' },
});

interface Machine {
  id: string;
  name: string;
  line: string;
  state: string;
  load: number;
  hours: number;
  nextService: string;
}

const lines = ['一号总装线', '二号总装线', '复材成型线', '机加线'];
const kinds = ['五轴加工中心', '自动钻铆机', '热压罐', '激光切割机', '涂装机器人'];
const machines: Machine[] = Array.from({ length: 40 }, (_, index) => ({
  id: `EQ-${String(1001 + index)}`,
  name: `${kinds[index % kinds.length]} ${(index % 4) + 1} 号`,
  line: lines[index % lines.length]!,
  state: ['running', 'running', 'running', 'warning', 'maintenance', 'down'][index % 6]!,
  load: 35 + ((index * 17) % 60),
  hours: 1200 + ((index * 389) % 8000),
  nextService: `2026-${String(11 + (index % 2)).padStart(2, '0')}-${String(1 + ((index * 7) % 28)).padStart(2, '0')}`,
}));

const columns: DataTableColumn<Machine>[] = [
  { key: 'id', header: '设备编号', width: 120, sticky: 'start' },
  { key: 'name', header: '设备名称', minWidth: 180 },
  { key: 'line', header: '所在产线', width: 140 },
  { key: 'state', header: '状态', width: 100, statuses: states },
  { key: 'load', header: '负荷（%）', width: 100, sortable: true },
  { key: 'hours', header: '累计运行（小时）', width: 150, sortable: true },
  { key: 'nextService', header: '下次保养', width: 120, sortable: true },
];

const styles = stylex.create({
  brand: { display: 'inline-flex', alignItems: 'center', gap: '_sm', fontWeight: '_semibold' },
  brandMark: { color: '_accentText' },
  header: { display: 'flex', alignItems: 'center', gap: '_md', flexGrow: 1, minWidth: 0 },
  tabs: { flexGrow: 1, minWidth: 0 },
  main: { paddingBlock: '_md', paddingInline: '_md' },
  // 正好占满窗口（减去顶栏与正文的上下内边距），表格在里面滚动
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    height: `calc(100dvh - 3rem - 2 * ${t.space.md})`,
    minHeight: '20rem',
  },
  table: { flexGrow: 1, minHeight: 0, maxHeight: 'none' },
});

export default _component(() => {
  let open = _state(true);
  let width = _state(256);
  let line = _state('all');

  return () => (
    <AppShell
      sidebarMode="overlay"
      sidebarOpen={_bind(open)}
      sidebarWidth={_bind(width)}
      propsMain={{ sx: styles.main }}
      brand={
        <span {...stylex.attrs(styles.brand)}>
          <Icon icon={Boxes} sx={styles.brandMark} />
          设备运维中心
        </span>
      }
      header={
        <div {...stylex.attrs(styles.header)}>
          <Tabs value={_bind(line)} sx={styles.tabs}>
            <TabList aria-label="产线">
              <Tab value="all">全部产线</Tab>
              {lines.map((item) => (
                <Tab key={item} value={item}>
                  {item}
                </Tab>
              ))}
            </TabList>
          </Tabs>
          <Avatar size="sm" name="周一航" />
        </div>
      }
      sidebar={
        <NavList aria-label="运维中心">
          <NavSection label="设备">
            <NavItem href="#machines" icon={Server} active>
              设备台账
            </NavItem>
            <NavItem href="#alarms" icon={Siren}>
              告警
            </NavItem>
            <NavItem href="#service" icon={Wrench}>
              保养计划
            </NavItem>
          </NavSection>
          <NavSection label="分析">
            <NavItem href="#oee" icon={Gauge}>
              OEE 分析
            </NavItem>
            <NavItem href="#settings" icon={Settings}>
              设置
            </NavItem>
          </NavSection>
        </NavList>
      }
    >
      <div {...stylex.attrs(styles.page)}>
        <Small tone="muted">
          导航{open ? '打开' : '收起'}，宽度 {width} px：表格的宽度不随侧栏变化
        </Small>
        <DataTable
          aria-label="设备台账"
          rows={line === 'all' ? machines : machines.filter((item) => item.line === line)}
          columns={columns}
          getKey={(item) => item.id}
          selectionMode="multiple"
          propsRoot={{ sx: styles.table }}
        />
      </div>
    </AppShell>
  );
});
