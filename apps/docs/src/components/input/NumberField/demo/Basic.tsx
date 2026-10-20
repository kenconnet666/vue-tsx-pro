import { _component } from '@vue-tsx-pro/tsx';
import { Field, Grid, NumberField } from '@vue-tsx-pro/ui';

export default _component(() => {
  let quantity = _state<number | null>(2);
  let weight = _state<number | null>(1.5);
  let discount = _state<number | null>(0.85);
  let temperature = _state<number | null>(-4);
  let rating = _state<number | null>(null);

  return () => (
    <Grid minItemWidth="14em" gap="lg">
      <Field label="数量" description="1–99，↑ ↓ 加减 1，Page Up / Down 加减 10">
        <NumberField value={_bind(quantity)} min={1} max={99} />
      </Field>
      <Field label="重量" description="步长 0.1，提交时对齐，没有浮点误差">
        <NumberField
          value={_bind(weight)}
          min={0}
          step={0.1}
          format={{ style: 'unit', unit: 'kilogram' }}
        />
      </Field>
      <Field label="折扣" description="存 0–1 的小数，显示成百分比">
        <NumberField
          value={_bind(discount)}
          min={0}
          max={1}
          step={0.05}
          format={{ style: 'percent' }}
        />
      </Field>
      <Field label="室外温度" description="可以是负数，Home / End 到两端">
        <NumberField
          value={_bind(temperature)}
          min={-40}
          max={60}
          format={{ style: 'unit', unit: 'celsius' }}
        />
      </Field>
      <Field label="评分" description="空着时为 null，按 ↑ 从 min 开始">
        <NumberField value={_bind(rating)} min={1} max={5} placeholder="1–5" />
      </Field>
    </Grid>
  );
});
