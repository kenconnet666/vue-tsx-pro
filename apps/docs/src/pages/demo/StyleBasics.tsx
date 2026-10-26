import { Sparkles, Zap, ShieldCheck } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Badge, Button, Icon, t, Text } from '@zerodep-dev/vue-tsx-pro-ui';

const plans = [
  { name: '入门', price: 0, icon: Sparkles, features: ['3 个项目', '社区支持'] },
  {
    name: '专业',
    price: 49,
    icon: Zap,
    features: ['不限项目', '优先支持', '自定义域名'],
    featured: true,
  },
  { name: '企业', price: 199, icon: ShieldCheck, features: ['单点登录', '审计日志', '专属顾问'] },
];

const styles = css.create({
  // 容器查询的容器：卡片按示例区的宽度排，不看整个视口
  wrap: { containerType: 'inline-size' },
  grid: {
    display: 'grid',
    gap: '_md',
    // 窄的时候一列、宽一点三列
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@container (min-width: 36rem)': 'repeat(3, minmax(0, 1fr))',
    },
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_sm',
    padding: '_lg',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: { default: '_borderMuted', ':hover': '_border' },
    borderRadius: '_lg',
    backgroundColor: '_surface',
    // 值里夹着 token：写模板字符串里的 t.组.名
    transition: `border-color ${t.durations.md} ${t.easings.standard}`,
  },
  featured: { borderColor: '_accentBorder', boxShadow: '_md' },
  head: { display: 'flex', alignItems: 'center', gap: '_sm', fontWeight: '_semibold' },
  icon: { color: '_accentText' },
  price: { fontSize: '_xxl', fontWeight: '_bold', lineHeight: '_tight' },
  unit: { fontSize: '_sm', color: '_textMuted', fontWeight: '_normal' },
  features: {
    display: 'grid',
    gap: '_xs',
    margin: 0,
    paddingInlineStart: '_lg',
    color: '_textMuted',
    flexGrow: 1,
    // 卡片拉高时条目留在上面，不均分高度
    alignContent: 'start',
  },
});

/** 一张卡片里用到的写法：create 的样式、条件取值、token 短写、模板字符串里的 t，以及直接写对象的 sx */
export default _component(() => () => (
  <div {...css.attrs(styles.wrap)}>
    <div {...css.attrs(styles.grid)}>
      {plans.map((plan) => (
        <section {...css.attrs(styles.card, plan.featured && styles.featured)}>
          <div {...css.attrs(styles.head)}>
            <Icon icon={plan.icon} sx={styles.icon} />
            {plan.name}
            {plan.featured && (
              // 一次性的覆盖直接写对象，不必先 create
              <Badge tone="accent" sx={{ marginInlineStart: 'auto' }}>
                推荐
              </Badge>
            )}
          </div>
          <div {...css.attrs(styles.price)}>
            ¥{plan.price}
            <span {...css.attrs(styles.unit)}> / 月</span>
          </div>
          <ul {...css.attrs(styles.features)}>
            {plan.features.map((feature) => (
              <li>{feature}</li>
            ))}
          </ul>
          <Button variant={plan.featured ? 'solid' : 'outline'} fullWidth>
            选择{plan.name}
          </Button>
          <Text size="xs" tone="muted" sx={{ textAlign: 'center' }}>
            随时取消
          </Text>
        </section>
      ))}
    </div>
  </div>
));
