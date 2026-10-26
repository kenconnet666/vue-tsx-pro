import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Badge, Text, type StatusTone, type StatusVariant } from '@zerodep-dev/vue-tsx-pro-ui';

const variants: StatusVariant[] = ['solid', 'soft', 'surface', 'outline'];
const tones: [StatusTone, string][] = [
  ['neutral', '草稿'],
  ['accent', '新功能'],
  ['info', '处理中'],
  ['success', '已完成'],
  ['warning', '即将到期'],
  ['danger', '已失败'],
];

const styles = css.create({
  // 一行一种样式、一列一种色调：第一列是样式名
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, max-content)',
    justifyContent: 'start',
    alignItems: 'center',
    gap: '_sm',
    columnGap: '_md',
    overflowX: 'auto',
  },
});

export default _component(() => () => (
  <div {...css.attrs(styles.grid)}>
    {variants.map((variant) => [
      <Text key={variant} size="xs" tone="muted">
        {variant}
      </Text>,
      ...tones.map(([tone, label]) => (
        <Badge key={`${variant}-${tone}`} variant={variant} tone={tone}>
          {label}
        </Badge>
      )),
    ])}
  </div>
));
