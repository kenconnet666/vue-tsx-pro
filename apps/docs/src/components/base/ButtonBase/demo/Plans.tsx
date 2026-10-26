import { Check } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { ButtonBase, Icon, Small, Strong } from '@zerodep-dev/vue-tsx-pro-ui';

const plans = [
  { id: 'free', name: '个人版', price: '免费', detail: '3 个项目 · 1 GB 存储' },
  { id: 'team', name: '团队版', price: '¥ 99 / 月', detail: '不限项目 · 50 GB · 10 人' },
  { id: 'business', name: '企业版', price: '¥ 499 / 月', detail: 'SSO 登录 · 审计日志 · 专属支持' },
];

// ButtonBase 只负责行为与焦点环，卡片外观全部由这里给出
const styles = css.create({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))',
    gap: '_md',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '_xs',
    padding: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: { default: '_border', ':hover': '_borderStrong' },
    borderRadius: '_md',
    backgroundColor: { default: '_surface', ':hover': '_fill' },
    textAlign: 'start',
  },
  selected: {
    borderColor: { default: '_accent', ':hover': '_accent' },
    backgroundColor: { default: '_accentSoft', ':hover': '_accentSoftHover' },
  },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '_full' },
  price: { fontSize: '_lg', fontWeight: '_semibold' },
});

export default _component(() => {
  let plan = _state('team');
  return () => (
    <div role="group" aria-label="套餐" {...css.attrs(styles.grid)}>
      {plans.map((item) => {
        const selected = item.id === plan;
        return (
          <ButtonBase
            key={item.id}
            aria-pressed={selected}
            sx={[styles.card, selected && styles.selected]}
            onClick={() => (plan = item.id)}
          >
            <span {...css.attrs(styles.head)}>
              <Strong>{item.name}</Strong>
              {selected && <Icon icon={Check} tone="accent" />}
            </span>
            <span {...css.attrs(styles.price)}>{item.price}</span>
            <Small tone="muted">{item.detail}</Small>
          </ButtonBase>
        );
      })}
    </div>
  );
});
