import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Badge, Flex, H2, Paragraph, t } from '@zerodep-dev/vue-tsx-pro-ui';
import { WaveGrid } from '@zerodep-dev/vue-tsx-pro-ui/three';

const styles = css.create({
  banner: {
    height: '22rem',
    borderRadius: '_lg',
    backgroundImage: `linear-gradient(to bottom, ${t.colors.surfaceMuted}, ${t.colors.background})`,
  },
  content: { padding: '_xl', textAlign: 'center' },
  lead: { color: '_textMuted', maxWidth: '30rem', marginInline: 'auto' },
});

export default _component(() => () => (
  <WaveGrid sx={styles.banner} propsContent={{ sx: styles.content }}>
    <Flex direction="column" gap="sm" align="center">
      <Badge variant="soft">实时数据</Badge>
      <H2 size="xxl">起伏的数据地形</H2>
      <Paragraph sx={styles.lead}>
        网格随噪声缓缓起伏，指针下方隆起；颜色按高度在主题色板里取，远处渐隐。
      </Paragraph>
    </Flex>
  </WaveGrid>
));
