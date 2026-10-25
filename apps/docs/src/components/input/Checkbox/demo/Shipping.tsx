import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Radio, RadioGroup, Small, Strong } from '@vue-tsx-pro/ui';

const options = [
  ['standard', '标准快递', '3–5 天送达', '免运费'],
  ['express', '顺丰次日达', '明天 18:00 前', '¥12'],
  ['pickup', '门店自提', '今天 15:00 后可取', '免运费'],
] as const;

export default _component(() => {
  let shipping = _state('express');
  let invoice = _state<string | null>(null);
  return () => (
    <Flex direction="column" gap="lg">
      <Field label="配送方式">
        <RadioGroup _value={_bind(shipping)} name="shipping">
          {options.map(([value, title, time, price]) => (
            <Radio key={value} value={value}>
              <Flex justify="between" gap="lg">
                <Flex direction="column">
                  <Strong>{title}</Strong>
                  <Small tone="muted">{time}</Small>
                </Flex>
                <Small>{price}</Small>
              </Flex>
            </Radio>
          ))}
        </RadioGroup>
      </Field>
      <Field label="发票" required error={invoice ? undefined : '请选择发票类型'}>
        <RadioGroup _value={_bind(invoice)} name="invoice" orientation="horizontal">
          <Radio value="none">不开发票</Radio>
          <Radio value="personal">个人</Radio>
          <Radio value="company">企业</Radio>
        </RadioGroup>
      </Field>
    </Flex>
  );
});
