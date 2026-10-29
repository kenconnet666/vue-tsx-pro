import { Sparkles } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  Field,
  Flex,
  Grid,
  Icon,
  Small,
  Strong,
  ColorField,
} from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({
  preview: {
    display: 'flex',
    alignItems: 'center',
    gap: '_md',
    padding: '_lg',
    borderRadius: '_lg',
  },
  badge: {
    display: 'grid',
    placeItems: 'center',
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '_md',
    fontSize: '1.25rem',
  },
});

// 颜色是任意值：动态样式单独一个 create
const colorStyles = css.create({
  surface: (background: string, foreground: string) => ({
    backgroundColor: background,
    color: foreground,
  }),
  badge: (color: string) => ({ backgroundColor: color, color: '#fff' }),
});

export default _component(() => {
  let brand = _state('#6e56cf');
  let background = _state('#f4f0fe');
  let text = _state('#2f265f');
  return () => (
    <Flex direction="column" gap="lg">
      <Grid minItemWidth="10rem" gap="md">
        <Field label="品牌色">
          <ColorField _value={brand} />
        </Field>
        <Field label="卡片底色">
          <ColorField _value={background} />
        </Field>
        <Field label="文字色">
          <ColorField _value={text} />
        </Field>
      </Grid>
      <Card padding="none">
        <div {...css.attrs(styles.preview, colorStyles.surface(background, text))}>
          <span {...css.attrs(styles.badge, colorStyles.badge(brand))}>
            <Icon icon={Sparkles} />
          </span>
          <Flex direction="column">
            <Strong>小满商城 · 会员日</Strong>
            <Small>全场满 300 减 50，今晚 24:00 截止</Small>
          </Flex>
        </div>
      </Card>
    </Flex>
  );
});
