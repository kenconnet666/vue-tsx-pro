// 外观与状态：与其他输入框同一套；Field 的 required、error、readonly、disabled 交给里面的 ColorField
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { ColorField, Field, Grid } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let accent = _state('#3e63dd');
  let background = _state('');
  return () => (
    <Grid minItemWidth="14rem" gap="lg">
      <Field label='variant="soft" radius="full"'>
        <ColorField _value={accent} variant="soft" radius="full" />
      </Field>
      <Field label='size="sm"'>
        <ColorField _value={accent} size="sm" />
      </Field>
      <Field label="背景色" required error={background ? undefined : '请填写背景色'}>
        <ColorField _value={background} />
      </Field>
      <Field label="只读" readonly>
        <ColorField _value="#30a46c" />
      </Field>
      <Field label="不可用" disabled>
        <ColorField _value="#e5484d" />
      </Field>
    </Grid>
  );
});
