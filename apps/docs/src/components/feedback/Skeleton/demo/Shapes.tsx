import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Grid, Skeleton, SkeletonText, Small } from '@vue-tsx-pro/ui';

const shapes = [
  ['text', '文字行'],
  ['heading', '标题'],
  ['circle', '头像'],
  ['button', '按钮'],
  ['image', '图片'],
] as const;

export default _component(() => () => (
  <Grid minItemWidth="10em" gap="lg" align="end">
    {shapes.map(([variant, label]) => (
      <Flex key={variant} direction="column" gap="sm">
        <Skeleton variant={variant} />
        <Small tone="muted">
          {label} variant="{variant}"
        </Small>
      </Flex>
    ))}
    <Flex direction="column" gap="sm">
      <SkeletonText lines={3} />
      <Small tone="muted">段落 SkeletonText</Small>
    </Flex>
  </Grid>
));
