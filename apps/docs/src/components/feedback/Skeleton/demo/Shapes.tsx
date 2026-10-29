import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Flex, Grid, Skeleton, SkeletonText, Small } from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({
  // 同一行的格子一样高：形状在剩下的空间里居中，说明文字都落在格子底部
  stage: { flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
});

const shapes = [
  ['text', '文字行'],
  ['heading', '标题'],
  ['circle', '头像'],
  ['button', '按钮'],
  ['image', '图片'],
] as const;

export default _component(() => () => (
  <Grid minItemWidth="10em" gap="lg">
    {shapes.map(([variant, label]) => (
      <Flex key={variant} direction="column" gap="sm">
        <div {...css.attrs(styles.stage)}>
          <Skeleton variant={variant} />
        </div>
        <Small tone="muted">
          {label} variant="{variant}"
        </Small>
      </Flex>
    ))}
    <Flex direction="column" gap="sm">
      <div {...css.attrs(styles.stage)}>
        <SkeletonText lines={3} />
      </div>
      <Small tone="muted">段落 SkeletonText</Small>
    </Flex>
  </Grid>
));
