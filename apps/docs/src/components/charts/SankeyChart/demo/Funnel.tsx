// 注册转化：访问从哪些渠道来、多少人注册、最后有多少付费，每一步流失多少一目了然
import { _component } from '@vue-tsx-pro/tsx';
import { SankeyChart } from '@vue-tsx-pro/ui/charts';
import { colors } from '@vue-tsx-pro/ui/tokens.stylex';

const nodes = [
  { id: 'search', label: '搜索引擎' },
  { id: 'social', label: '社交媒体' },
  { id: 'ads', label: '广告投放' },
  { id: 'visit', label: '落地页' },
  { id: 'signup', label: '注册' },
  { id: 'bounce', label: '跳出', color: colors.textMuted },
  { id: 'trial', label: '开始试用' },
  { id: 'idle', label: '未激活', color: colors.textMuted },
  { id: 'paid', label: '付费', color: 'chart7' },
  { id: 'churn', label: '试用后流失', color: colors.textMuted },
];

const links = [
  { source: 'search', target: 'visit', value: 5200 },
  { source: 'social', target: 'visit', value: 3100 },
  { source: 'ads', target: 'visit', value: 2400 },
  { source: 'visit', target: 'signup', value: 4300 },
  { source: 'visit', target: 'bounce', value: 6400 },
  { source: 'signup', target: 'trial', value: 2900 },
  { source: 'signup', target: 'idle', value: 1400 },
  { source: 'trial', target: 'paid', value: 1150 },
  { source: 'trial', target: 'churn', value: 1750 },
];

export default _component(() => () => (
  <SankeyChart aria-label="注册转化" nodes={nodes} links={links} unit="人" height={380} />
));
