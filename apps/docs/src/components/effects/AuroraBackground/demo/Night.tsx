import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Button, Flex, H2, midnightTheme, Paragraph, Provider, Text } from '@vue-tsx-pro/ui';
import { AuroraBackground } from '@vue-tsx-pro/ui/three';

const styles = stylex.create({
  hero: {
    minHeight: '24rem',
    borderRadius: '_lg',
    backgroundColor: '_background',
    display: 'flex',
    alignItems: 'flex-end',
  },
  content: { padding: '_xl', maxWidth: '34rem' },
  eyebrow: { color: '_accentText', letterSpacing: '0.12em' },
  lead: { color: '_textMuted' },
});

export default _component(() => () => (
  <Provider theme={midnightTheme}>
    <AuroraBackground sx={styles.hero} propsContent={{ sx: styles.content }}>
      <Flex direction="column" gap="md">
        <Text size="xs" weight="semibold" sx={styles.eyebrow}>
          北纬 69°
        </Text>
        <H2 size="xxl">在夜空下发布</H2>
        <Paragraph sx={styles.lead}>
          这一块用了午夜主题：极光的绿、青、紫取自它的图表色板，品牌色在中间那层。背景透明，叠在主题的底色上。
        </Paragraph>
        <Flex gap="sm">
          <Button>预约演示</Button>
          <Button variant="ghost">了解更多</Button>
        </Flex>
      </Flex>
    </AuroraBackground>
  </Provider>
));
