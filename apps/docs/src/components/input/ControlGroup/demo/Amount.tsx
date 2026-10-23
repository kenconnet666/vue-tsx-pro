// 币种 + 金额 + 换算：选择框按内容宽，金额框分掉剩余宽度，按钮贴在末尾
import { _component } from '@vue-tsx-pro/tsx';
import { Button, ControlGroup, Field, Flex, NumberField, Select, Small } from '@vue-tsx-pro/ui';

const rates: Record<string, number> = { CNY: 1, USD: 7.12, EUR: 7.71, JPY: 0.047 };
const currencies = Object.keys(rates).map((code) => ({ value: code, label: code }));

export default _component(() => {
  let currency = _state('USD');
  let amount = _state<number | null>(1200);
  let result = _state('');
  const convert = () =>
    (result = `≈ ${((amount ?? 0) * rates[currency]!).toLocaleString('zh-CN', {
      maximumFractionDigits: 2,
    })} 元`);

  return () => (
    <Flex direction="column" gap="lg">
      <Field label="合同金额" description="按当天中间价换算成人民币">
        <ControlGroup aria-label="合同金额">
          <Select items={currencies} value={_bind(currency)} aria-label="币种" />
          <NumberField value={_bind(amount)} min={0} aria-label="金额" />
          <Button variant="outline" tone="neutral" onClick={convert}>
            换算
          </Button>
        </ControlGroup>
      </Field>
      <Small tone="muted" aria-live="polite">
        {result || '点“换算”看人民币金额'}
      </Small>
      <Field label="单价区间">
        <ControlGroup aria-label="单价区间">
          <NumberField value={10} prefix="¥" aria-label="最低单价" />
          <NumberField value={80} prefix="¥" aria-label="最高单价" />
          <Select
            items={[
              { value: 'piece', label: '每件' },
              { value: 'kg', label: '每千克' },
            ]}
            value="piece"
            aria-label="计价单位"
          />
        </ControlGroup>
      </Field>
    </Flex>
  );
});
