import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Slider, Small } from '@vue-tsx-pro/ui';

const yuan = (value: number) => `¥${value.toLocaleString()}`;

export default _component(() => {
  let price = _state<[number, number]>([800, 3500]);
  let committed = _state<[number, number]>([800, 3500]);
  let rating = _state(4);
  return () => (
    <Flex direction="column" gap="xl">
      <Field
        label="价格区间"
        description="拖动时实时写回；松手（或键盘改完）时 onValueCommit 才去查询"
      >
        <Slider
          _value={price}
          min={0}
          max={5000}
          step={100}
          marks={[
            { value: 0, label: '¥0' },
            { value: 1000, label: '¥1k' },
            { value: 2500, label: '¥2.5k' },
            { value: 5000, label: '¥5k+' },
          ]}
          valueText={yuan}
          onValueCommit={(next) => (committed = next)}
        />
      </Field>
      <Small tone="muted">
        正在看 {yuan(price[0])}–{yuan(price[1])}；已查询 {yuan(committed[0])}–{yuan(committed[1])}
      </Small>
      <Field label="最低评分">
        <Slider
          _value={rating}
          min={1}
          max={5}
          marks={[1, 2, 3, 4, 5].map((value) => ({ value, label: `${value} 星` }))}
          tone="success"
          valueText={(value) => `${value} 星及以上`}
        />
      </Field>
    </Flex>
  );
});
