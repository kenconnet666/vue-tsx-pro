import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Flex, H2, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { MeshGradient, ParticleField } from '@zerodep-dev/vue-tsx-pro-ui/three';
import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';

const styles = css.create({
  hero: { borderRadius: '_lg', height: '20rem' },
  // 粒子场作为渐变的内容，铺满整块
  field: { height: '20rem', display: 'grid', placeItems: 'center' },
  title: { color: '_inverseText', textAlign: 'center' },
  lead: { color: '_inverseText', opacity: 0.85, textAlign: 'center', maxWidth: '28rem' },
});

export default _component(() => () => (
  <MeshGradient sx={styles.hero} distortion={0.9}>
    <ParticleField
      sx={styles.field}
      palette={[colors.inverseText]}
      size={2.5}
      links
      linkDistance={90}
    >
      <Flex direction="column" gap="sm" align="center">
        <H2 size="xxl" sx={styles.title}>
          两层效果叠在一起
        </H2>
        <Paragraph sx={styles.lead}>
          网格渐变在底层，粒子场是它的内容，标题又是粒子场的内容。两块画布各占一个 WebGL 上下文。
        </Paragraph>
      </Flex>
    </ParticleField>
  </MeshGradient>
));
