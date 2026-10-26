// 数值区间：预期收益量级（以元保存、按万元输入），一端可以空着；起比止大时自动对调；外观同其他输入框
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Code,
  Field,
  Flex,
  Grid,
  NumberRangeField,
  Small,
  type NumberRange,
} from '@zerodep-dev/vue-tsx-pro-ui';
import Decimal from 'decimal.js';

const text = (range: NumberRange) =>
  range.map((end) => (end == null ? '不限' : `${end.toString()} 元`)).join(' ～ ');

export default _component(() => {
  let saving = _state.raw<NumberRange>([new Decimal('100000'), new Decimal('500000')]);
  let stores = _state<NumberRange>([20, null]);
  let price = _state<NumberRange>([null, 1200]);
  return () => (
    <Grid minItemWidth="16rem" gap="lg">
      <Flex direction="column" gap="xs">
        <Field label="预期收益量级" description="填 50 和 10 试试：失焦后自动对调">
          <NumberRangeField
            _value={saving}
            valueType={Decimal}
            format={{ scale: 10_000, maximumFractionDigits: 2 }}
            suffix="万元"
            min={0}
          />
        </Field>
        <Small tone="muted">
          保存的值：<Code>{text(saving)}</Code>
        </Small>
      </Flex>
      <Flex direction="column" gap="xs">
        <Field label="门店数量" description="只填起：20 家以上">
          <NumberRangeField _value={stores} min={0} suffix="家" separator="至" />
        </Field>
        <Small tone="muted">
          值：<Code>{JSON.stringify(stores)}</Code>
        </Small>
      </Flex>
      <Flex direction="column" gap="xs">
        <Field label="单价" description="筛选栏里常用：浅底、小号、胶囊形">
          <NumberRangeField
            _value={price}
            min={0}
            prefix="$"
            variant="soft"
            size="sm"
            radius="full"
          />
        </Field>
        <Small tone="muted">
          值：<Code>{JSON.stringify(price)}</Code>
        </Small>
      </Flex>
    </Grid>
  );
});
