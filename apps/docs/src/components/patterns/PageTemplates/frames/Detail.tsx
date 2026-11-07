// 详情页：面包屑、标题行（单号、状态、操作）、标签页（基本信息、明细、审批记录），右侧是供应商与金额
import { Check, Pencil, Truck } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Avatar,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  ColumnTable,
  Descriptions,
  Flex,
  Grid,
  H1,
  Small,
  Stat,
  Strong,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Timeline,
  type DataTableColumn,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { orders, statuses } from '../template-data';
import { TemplateShell } from '../template-shell';

const order = orders[3]!;

interface Line {
  part: string;
  name: string;
  quantity: number;
  price: number;
}

const lines: Line[] = [
  { part: 'MX-2041', name: '导轨滑块 20 mm', quantity: 40, price: 86.5 },
  { part: 'MX-1180', name: '直线轴承 LM12', quantity: 120, price: 12.8 },
  { part: 'FT-0630', name: '内六角螺栓 M6×30', quantity: 800, price: 0.42 },
];

const lineColumns: DataTableColumn<Line>[] = [
  { key: 'part', header: '料号' },
  { key: 'name', header: '名称' },
  { key: 'quantity', header: '数量', type: 'number', summary: 'sum' },
  { key: 'price', header: '单价', type: 'currency' },
  {
    key: 'total',
    header: '小计',
    type: 'currency',
    value: (line) => line.quantity * line.price,
    summary: 'sum',
  },
];

export default _component(() => {
  let tab = _state('info');
  return () => (
    <TemplateShell current="orders">
      <Flex direction="column" gap="lg">
        <Breadcrumbs items={[{ label: '采购单', href: '#orders' }, { label: order.id }]} />
        <Flex align="center" gap="md" wrap>
          <H1 size="xxl">{order.id}</H1>
          <Badge tone={statuses.tone(order.status)}>{statuses.label(order.status)}</Badge>
          <Flex gap="xs" style={{ marginInlineStart: 'auto' }}>
            <Button variant="outline" tone="neutral" icon={Pencil}>
              编辑
            </Button>
            <Button icon={Truck}>催单</Button>
          </Flex>
        </Flex>
        <Grid
          minItemWidth="16rem"
          gap="lg"
          style={{ gridTemplateColumns: 'minmax(0, 3fr) minmax(14rem, 1fr)' }}
        >
          <Tabs _value={tab}>
            <TabList aria-label="采购单">
              <Tab value="info">基本信息</Tab>
              <Tab value="lines">明细</Tab>
              <Tab value="history">审批记录</Tab>
            </TabList>
            <TabPanel value="info">
              <Descriptions
                columns="auto"
                items={[
                  { label: '采购单号', value: order.id, copyable: true },
                  { label: '品类', value: order.category },
                  { label: '采购员', value: order.buyer },
                  { label: '下单日期', value: order.orderedAt },
                  { label: '交付地点', value: '苏州工业园区星湖街 328 号 3 号仓', span: 2 },
                ]}
              />
            </TabPanel>
            <TabPanel value="lines">
              <ColumnTable
                rows={lines}
                columns={lineColumns}
                getKey={(line) => line.part}
                aria-label="明细"
              />
            </TabPanel>
            <TabPanel value="history">
              <Timeline
                items={[
                  { title: '提交申请', time: '10-16 09:12', actor: order.buyer },
                  {
                    title: '部门经理审批通过',
                    time: '10-16 14:30',
                    actor: '周一航',
                    tone: 'success',
                    icon: Check,
                  },
                  {
                    title: '财务审批通过',
                    time: '10-17 10:05',
                    actor: '陈默',
                    tone: 'success',
                    icon: Check,
                  },
                ]}
                pending="等待供应商确认"
              />
            </TabPanel>
          </Tabs>
          <Flex direction="column" gap="md">
            <Card>
              <Stat label="合计金额" value={order.amount} unit="元" />
            </Card>
            <Card>
              <Flex align="center" gap="sm">
                <Avatar name={order.supplier} />
                <Flex direction="column">
                  <Strong>{order.supplier}</Strong>
                  <Small tone="muted">合作 4 年 · 准时交付 97%</Small>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        </Grid>
      </Flex>
    </TemplateShell>
  );
});
