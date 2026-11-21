// 相对的输入：+=、-=、*=、/= 按当前值算；onRelative 把同一个算法用到几个值上（多选一起改，各按各的值算）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Code,
  Field,
  Flex,
  NumberField,
  Small,
  type NumericValue,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let price = _state<number | null>(120);
  let stocks = _state<number[]>([12, 30, 7]);
  const applyToAll = (apply: (current: NumericValue | null) => NumericValue) => {
    stocks = stocks.map((stock) => Number(apply(stock)));
  };
  return () => (
    <Flex direction="column" gap="md">
      <Field label="单价" description="输入 *=1.1 涨一成，-=20 降 20">
        <NumberField _value={price} min={0} step={0.01} suffix="元" />
      </Field>
      <Field label="三家门店的库存一起改" description="输入 +=5 每家各加 5，*=2 各翻一倍">
        <NumberField _value={null} min={0} placeholder="多个值" onRelative={applyToAll} />
      </Field>
      <Small tone="muted">
        库存：<Code>{JSON.stringify(stocks)}</Code>
      </Small>
    </Flex>
  );
});
