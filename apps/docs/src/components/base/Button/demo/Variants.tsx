import { _component } from '@vue-tsx-pro/tsx';
import { Button, Flex, Grid, Small } from '@vue-tsx-pro/ui';

const variants = [
  ['solid', '主要操作，每组最多一个'],
  ['soft', '需要突出的次要操作'],
  ['surface', '表单、设置页里的次要操作'],
  ['outline', '次要操作'],
  ['ghost', '工具栏、行内操作'],
  ['link', '句子中间的操作'],
] as const;

export default _component(() => () => (
  <Grid minItemWidth="9rem" gap="lg">
    {variants.map(([variant, usage]) => (
      <Flex key={variant} direction="column" align="start" gap="xs">
        <Button variant={variant}>{variant}</Button>
        <Small tone="muted">{usage}</Small>
      </Flex>
    ))}
  </Grid>
));
