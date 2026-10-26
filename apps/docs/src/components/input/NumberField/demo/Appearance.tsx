import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Field, Grid, NumberField } from '@zerodep-dev/vue-tsx-pro-ui';

const sizes = ['sm', 'md', 'lg'] as const;

export default _component(() => {
  let value = _state<number | null>(12);

  return () => (
    <Grid minItemWidth="13em" gap="lg">
      {sizes.map((size) => (
        <Field key={`surface-${size}`} label={`surface · ${size}`}>
          <NumberField _value={value} size={size} />
        </Field>
      ))}
      {sizes.map((size) => (
        <Field key={`soft-${size}`} label={`soft · ${size}`}>
          <NumberField _value={value} variant="soft" size={size} />
        </Field>
      ))}
      <Field label="胶囊形">
        <NumberField _value={value} radius="full" />
      </Field>
      <Field label="可清空" description="clearable：选填的数量，清空后值是 null">
        <NumberField _value={value} clearable />
      </Field>
      <Field label="不要加减按钮" description="stepper={false}，方向键照常可用">
        <NumberField _value={value} stepper={false} />
      </Field>
      <Field label="只读">
        <NumberField _value={value} readonly />
      </Field>
      <Field label="不可用">
        <NumberField _value={value} disabled />
      </Field>
      <Field label="出错" error="库存只剩 10 件">
        <NumberField _value={value} max={10} />
      </Field>
    </Grid>
  );
});
