// 色板（下一次放时生效）与收尾：onDone 在这几批都落完后调用；“关闭特效”时 quality="off"，不放、直接 onDone
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  Card,
  Field,
  Flex,
  Grid,
  Small,
  Switch,
  ToggleGroup,
  ToggleItem,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { CONFETTI_PALETTE, Confetti } from '@zerodep-dev/vue-tsx-pro-ui/three';
import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';

const PALETTES = {
  default: CONFETTI_PALETTE,
  gold: [colors.warning, colors.chart3, colors.chart4],
  brand: [colors.accent, colors.accentSoft, colors.chart5],
};

const styles = css.create({
  stage: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '_sm',
    height: '16rem',
    paddingBottom: '_lg',
    overflow: 'hidden',
  },
});

export default _component(() => {
  let palette = _state<keyof typeof PALETTES>('default');
  let effects = _state(true);
  let fired = _state(0);
  let flying = _state(false);
  let finished = _state(0);
  return () => (
    <Flex direction="column" gap="md">
      <Grid minItemWidth="12rem" gap="lg" align="end">
        <Field label="色板">
          <ToggleGroup _value={palette} required>
            <ToggleItem value="default">默认</ToggleItem>
            <ToggleItem value="gold">金色</ToggleItem>
            <ToggleItem value="brand">品牌色</ToggleItem>
          </ToggleGroup>
        </Field>
        <Switch _checked={effects}>动态特效</Switch>
      </Grid>
      <Card padding="none">
        <div {...css.attrs(styles.stage)}>
          <Confetti
            fullscreen={false}
            trigger={fired}
            origin={{ x: 0.5, y: 0.8 }}
            palette={PALETTES[palette]}
            quality={effects ? 'auto' : 'off'}
            onDone={() => {
              flying = false;
              finished++;
            }}
          />
          <Button
            onClick={() => {
              fired++;
              flying = true;
            }}
          >
            放一次
          </Button>
          <Small tone="muted">{flying ? '飘落中…' : `已落完 ${finished} 次`}</Small>
        </div>
      </Card>
    </Flex>
  );
});
