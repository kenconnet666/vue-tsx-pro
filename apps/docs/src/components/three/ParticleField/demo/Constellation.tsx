import { Rocket, Sparkles, Zap } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Card, Flex, Grid, H3, Icon, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { ParticleField } from '@zerodep-dev/vue-tsx-pro-ui/three';

const FEATURES = [
  { icon: Zap, title: '即时', text: '粒子在独立的动画帧里更新，滚出视口自动停下。' },
  { icon: Sparkles, title: '跟随主题', text: '颜色取自主题色板，切换主题时原地过渡。' },
  { icon: Rocket, title: '可组合', text: '叠在任何背景上，内容照常排版、交互。' },
];

const styles = css.create({
  field: { borderRadius: '_lg', backgroundColor: '_surfaceMuted', padding: '_xl' },
  card: { backgroundColor: '_surfaceTranslucent', backdropFilter: 'blur(6px)' },
  icon: { color: '_accentText', fontSize: '1.5rem' },
  text: { color: '_textMuted' },
});

export default _component(() => () => (
  <ParticleField links sx={styles.field}>
    <Grid minItemWidth="10rem" gap="md">
      {FEATURES.map((feature) => (
        <Card key={feature.title} sx={styles.card}>
          <Flex direction="column" gap="sm">
            <Icon icon={feature.icon} sx={styles.icon} />
            <H3 size="lg">{feature.title}</H3>
            <Paragraph size="sm" sx={styles.text}>
              {feature.text}
            </Paragraph>
          </Flex>
        </Card>
      ))}
    </Grid>
  </ParticleField>
));
