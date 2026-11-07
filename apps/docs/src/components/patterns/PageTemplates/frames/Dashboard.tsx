// 仪表盘：指标（Stat，带趋势小图）、按月的采购额（BarChart）、待办（ItemList）与最近的采购单
import { AlarmClock, FileCheck2, PackageCheck } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Badge,
  Card,
  Flex,
  Grid,
  H1,
  Icon,
  ItemList,
  ItemListItem,
  Small,
  Stat,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { BarChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';
import { orders, statuses } from '../template-data';
import { TemplateShell } from '../template-shell';

const monthly = [
  { month: '5 月', amount: 182 },
  { month: '6 月', amount: 214 },
  { month: '7 月', amount: 196 },
  { month: '8 月', amount: 248 },
  { month: '9 月', amount: 231 },
  { month: '10 月', amount: 275 },
];

const todos = [
  {
    icon: FileCheck2,
    title: '3 张采购单等你审批',
    meta: '最早的已等 2 天',
    tone: 'warning' as const,
  },
  {
    icon: AlarmClock,
    title: '2 张采购单超过交期未到货',
    meta: '远山钣金、北辰电子',
    tone: 'danger' as const,
  },
  { icon: PackageCheck, title: '5 批货物待验收', meta: '今天到货', tone: 'info' as const },
];

export default _component(() => () => (
  <TemplateShell current="dashboard">
    <Flex direction="column" gap="lg">
      <H1 size="xxl">概览</H1>
      <Grid minItemWidth="12rem" gap="md" balanced>
        <Card>
          <Stat label="本月采购额" value={2_750_000} unit="元" change={0.19} />
        </Card>
        <Card>
          <Stat label="在途采购单" value={42} change={-0.08} />
        </Card>
        <Card>
          <Stat label="准时交付率" value={96.2} unit="%" change={0.012} />
        </Card>
        <Card>
          <Stat label="合作供应商" value={36} />
        </Card>
      </Grid>
      <Grid minItemWidth="20rem" gap="md">
        <Card header="按月采购额">
          <BarChart
            data={monthly}
            index="month"
            series={[{ key: 'amount', label: '采购额' }]}
            unit="万元"
            aria-label="按月采购额"
          />
        </Card>
        <Card header="待办">
          <ItemList>
            {todos.map((todo) => (
              <ItemListItem
                key={todo.title}
                href="#orders"
                start={<Icon icon={todo.icon} tone={todo.tone} />}
                title={todo.title}
                description={todo.meta}
              />
            ))}
          </ItemList>
        </Card>
      </Grid>
      <Card header="最近的采购单">
        <ItemList>
          {orders.slice(0, 4).map((order) => (
            <ItemListItem
              key={order.id}
              href="#detail"
              title={`${order.id} · ${order.supplier}`}
              description={`${order.buyer} · ${order.orderedAt}`}
              end={
                <Flex align="center" gap="sm">
                  <Small>¥ {order.amount.toLocaleString('zh-CN')}</Small>
                  <Badge tone={statuses.tone(order.status)}>{statuses.label(order.status)}</Badge>
                </Flex>
              }
            />
          ))}
        </ItemList>
      </Card>
    </Flex>
  </TemplateShell>
));
