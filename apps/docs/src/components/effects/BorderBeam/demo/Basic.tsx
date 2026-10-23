import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Button, Card, Flex, H3, Paragraph, TextField } from '@vue-tsx-pro/ui';
import { BorderBeam } from '@vue-tsx-pro/ui/effects';

const styles = stylex.create({
  card: { position: 'relative', maxWidth: '24rem' },
  text: { color: '_textMuted' },
});

export default _component(() => () => (
  <Card sx={styles.card}>
    <Flex direction="column" gap="md">
      <H3 size="lg">订阅更新</H3>
      <Paragraph size="sm" sx={styles.text}>
        每周一封，介绍新组件与主题。光带沿着卡片的边框流动，不占布局、不接收指针。
      </Paragraph>
      <TextField aria-label="邮箱" placeholder="you@example.com" />
      <Button>订阅</Button>
    </Flex>
    <BorderBeam />
  </Card>
));
