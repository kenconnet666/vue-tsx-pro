// 尺寸与状态：size 改字号，格子按 em 等比缩放；只读能翻页、不能改；不可用整个变淡
import { _component } from '@vue-tsx-pro/tsx';
import { Calendar, Flex, Grid, Small, todayIso } from '@vue-tsx-pro/ui';

export default _component(() => {
  const today = todayIso();
  const cases = [
    ['size="sm"：侧栏、筛选面板', { size: 'sm' }],
    ['size="md"', { size: 'md' }],
    ['size="lg"：触屏、大屏', { size: 'lg' }],
    ['readonly：能翻页、不能改', { readonly: true }],
    ['disabled', { disabled: true }],
  ] as const;
  return () => (
    <Grid minItemWidth="16rem" gap="xl" align="start">
      {cases.map(([label, props]) => (
        <Flex key={label} direction="column" gap="xs">
          <Small tone="muted">{label}</Small>
          <Calendar value={today} {...props} aria-label={label} />
        </Flex>
      ))}
    </Grid>
  );
});
