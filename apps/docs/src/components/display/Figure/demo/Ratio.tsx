// 固定宽高比：宽度跟着容器，高度按比例；里面的图片铺满、按 cover 裁切
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { AspectRatio, Flex, Grid, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { drawings } from '../../Image/demo/drawings';

const styles = css.create({
  frame: { borderRadius: '_md' },
  note: {
    display: 'grid',
    placeItems: 'center',
    backgroundColor: '_fill',
    color: '_textMuted',
  },
});

const cases = [
  ['16 / 9（默认）', 16 / 9],
  ['4 / 3', '4 / 3'],
  ['1', 1],
] as const;

export default _component(() => () => (
  <Grid minItemWidth="10rem" gap="lg" align="start">
    {cases.map(([label, ratio], index) => (
      <Flex key={label} direction="column" gap="xs">
        <AspectRatio ratio={ratio} sx={styles.frame}>
          {index < 2 ? (
            <img src={drawings[index + 1]!.src} alt={drawings[index + 1]!.title} />
          ) : (
            <div {...css.attrs(styles.note)}>任意内容</div>
          )}
        </AspectRatio>
        <Small tone="muted">ratio：{label}</Small>
      </Flex>
    ))}
  </Grid>
));
