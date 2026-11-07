// 实时指标：每 2 秒推一个新值，数值滚动到新值，变化量与上一次比较；下面是最近 12 次的柱，最新的一根实色
import { Activity, Gauge, ShoppingCart, Users } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  Flex,
  Grid,
  Small,
  Sparkline,
  Stat,
  Switch,
  type IconData,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { onScopeDispose } from 'vue';

interface Metric {
  label: string;
  icon: IconData;
  unit: string;
  /** 每次跳动的幅度 */
  spread: number;
  history: number[];
}

const seed = (base: number, spread: number) =>
  Array.from({ length: 12 }, (_, index) => Math.round(base + Math.sin(index) * spread));

export default _component(() => {
  let running = _state(true);
  let metrics = _state<Metric[]>([
    { label: '在线人数', icon: Users, unit: '人', spread: 180, history: seed(3260, 180) },
    { label: '每分钟订单', icon: ShoppingCart, unit: '单', spread: 12, history: seed(86, 12) },
    { label: '接口 QPS', icon: Activity, unit: '次/秒', spread: 90, history: seed(1420, 90) },
    { label: '平均延迟', icon: Gauge, unit: 'ms', spread: 14, history: seed(118, 14) },
  ]);

  const tick = () => {
    if (!running) return;
    metrics = metrics.map((metric) => {
      const last = metric.history.at(-1)!;
      const next = Math.max(0, Math.round(last + (Math.random() - 0.5) * metric.spread));
      return { ...metric, history: [...metric.history.slice(1), next] };
    });
  };
  const timer = setInterval(tick, 2000);
  onScopeDispose(() => clearInterval(timer));

  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="md" align="center" wrap>
        <Switch _checked={running}>每 2 秒刷新</Switch>
        <Small tone="muted">数值滚动到新值，变化量与上一次比较</Small>
      </Flex>
      <Grid minItemWidth="15em" gap="md" balanced>
        {metrics.map(({ label, icon, unit, history }) => {
          const value = history.at(-1)!;
          const previous = history.at(-2)!;
          const min = Math.min(...history);
          const max = Math.max(...history);
          return (
            <Card key={label}>
              <Stat
                label={label}
                icon={icon}
                value={value}
                unit={unit}
                change={previous ? (value - previous) / previous : 0}
                changeLabel="较上次"
                invertChange={label === '平均延迟'}
              >
                {/* 柱默认从 0 起；值都在几千上下时从略低于最小值的地方起，起伏才看得出 */}
                <Sparkline
                  data={history}
                  type="bar"
                  domain={[min - (max - min) / 3, undefined]}
                  label={`最近 12 次${label}`}
                />
              </Stat>
            </Card>
          );
        })}
      </Grid>
    </Flex>
  );
});
