import { Activity, Gauge, ShoppingCart, Users } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, Grid, Small, Stat, Switch, type IconData } from '@vue-tsx-pro/ui';
import { onScopeDispose } from 'vue';

const styles = stylex.create({
  // 迷你趋势：最近 12 次的柱，最新的一根用强调色
  trend: { display: 'flex', alignItems: 'flex-end', gap: '2px', height: '2rem' },
  bar: {
    flexGrow: 1,
    borderRadius: '1px',
    backgroundColor: '_accentSoftHover',
    transitionProperty: 'height',
    transitionDuration: '_durations.md',
    transitionTimingFunction: '_easings.standard',
  },
  latest: { backgroundColor: '_accent' },
  height: (percent: string) => ({ height: percent }),
});

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
        <Switch checked={_bind(running)}>每 2 秒刷新</Switch>
        <Small tone="muted">数值滚动到新值，变化量与上一次比较</Small>
      </Flex>
      <Grid minItemWidth="15em" gap="md">
        {metrics.map(({ label, icon, unit, history }) => {
          const value = history.at(-1)!;
          const previous = history.at(-2)!;
          const max = Math.max(...history);
          const min = Math.min(...history);
          return (
            <Card key={label}>
              <Flex direction="column" gap="md">
                <Stat
                  label={label}
                  icon={icon}
                  value={value}
                  unit={unit}
                  change={previous ? (value - previous) / previous : 0}
                  changeLabel="较上次"
                  invertChange={label === '平均延迟'}
                />
                <div {...stylex.attrs(styles.trend)} aria-hidden="true">
                  {history.map((point, index) => (
                    <span
                      key={index}
                      {...stylex.attrs(
                        styles.bar,
                        index === history.length - 1 && styles.latest,
                        styles.height(`${25 + ((point - min) / (max - min || 1)) * 75}%`),
                      )}
                    />
                  ))}
                </div>
              </Flex>
            </Card>
          );
        })}
      </Grid>
    </Flex>
  );
});
