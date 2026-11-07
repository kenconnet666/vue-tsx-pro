// 内容叠在极光上（children）；跟随指针、暂停；“关闭特效”用 quality="off"，显示自己给的 fallback
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Button, Card, Flex, H3, Paragraph, Switch, t } from '@zerodep-dev/vue-tsx-pro-ui';
import { AuroraBackground } from '@zerodep-dev/vue-tsx-pro-ui/three';

const styles = css.create({
  stage: {
    minHeight: '20rem',
    borderRadius: '_lg',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: '_surfaceMuted',
  },
  card: { maxWidth: '22rem', textAlign: 'center' },
  // 关闭特效时的静态画面：顶部一抹同色调的渐变
  fallback: {
    height: '100%',
    backgroundImage: `linear-gradient(to bottom, color-mix(in oklab, ${t.colors.chart2} 35%, transparent), transparent 60%)`,
  },
});

export default _component(() => {
  let interactive = _state(true);
  let paused = _state(false);
  let effects = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" wrap>
        <Switch _checked={effects}>动态背景</Switch>
        <Switch _checked={interactive} disabled={!effects}>
          跟随指针
        </Switch>
        <Switch _checked={paused} disabled={!effects}>
          暂停
        </Switch>
      </Flex>
      <AuroraBackground
        sx={styles.stage}
        quality={effects ? 'auto' : 'off'}
        interactive={interactive}
        paused={paused}
        fallback={<div {...css.attrs(styles.fallback)} />}
      >
        <Card padding="lg" variant="elevated" sx={styles.card}>
          <Flex direction="column" gap="sm" align="center">
            <H3 size="lg">欢迎回来</H3>
            <Paragraph tone="muted" size="sm">
              上次登录在 3 天前。你有 2 条新的评论和 1 个待审核的合同。
            </Paragraph>
            <Button>进入工作台</Button>
          </Flex>
        </Card>
      </AuroraBackground>
    </Flex>
  );
});
