import { _component } from '@vue-tsx-pro/tsx';
import { Field, Grid, NumberField } from '@vue-tsx-pro/ui';

const sizes = ['sm', 'md', 'lg'] as const;

export default _component(() => {
  let value = _state<number | null>(12);

  return () => (
    <Grid minItemWidth="13em" gap="lg">
      {sizes.map((size) => (
        <Field key={`surface-${size}`} label={`surface · ${size}`}>
          <NumberField value={_bind(value)} size={size} />
        </Field>
      ))}
      {sizes.map((size) => (
        <Field key={`soft-${size}`} label={`soft · ${size}`}>
          <NumberField value={_bind(value)} variant="soft" size={size} />
        </Field>
      ))}
      <Field label="胶囊形">
        <NumberField value={_bind(value)} radius="full" />
      </Field>
      <Field label="不要加减按钮" description="stepper={false}，方向键照常可用">
        <NumberField value={_bind(value)} stepper={false} />
      </Field>
      <Field label="只读">
        <NumberField value={_bind(value)} readonly />
      </Field>
      <Field label="不可用">
        <NumberField value={_bind(value)} disabled />
      </Field>
      <Field label="出错" error="库存只剩 10 件">
        <NumberField value={_bind(value)} max={10} />
      </Field>
    </Grid>
  );
});
