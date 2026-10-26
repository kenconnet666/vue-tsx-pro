import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Grid } from '@zerodep-dev/vue-tsx-pro-ui';
import { colors } from '@zerodep-dev/vue-tsx-pro-ui/tokens';
import { ColorSwatch } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';

const tokens = [
  'accent',
  'accentSoft',
  'success',
  'warning',
  'danger',
  'info',
  'surface',
  'surfaceTranslucent',
  'text',
  'textMuted',
  'border',
  'chart3',
] as const;

export default _component(() => () => (
  <Grid minItemWidth="7rem" gap="md">
    {tokens.map((token) => (
      <ColorSwatch key={token} color={colors[token]} label={token} />
    ))}
  </Grid>
));
