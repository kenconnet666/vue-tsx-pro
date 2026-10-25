// items：选项来自数据（字典、接口），不用一个个写 Checkbox / Radio；说明写在 description
import { _component } from '@vue-tsx-pro/tsx';
import { CheckboxGroup, Code, Field, Flex, RadioGroup } from '@vue-tsx-pro/ui';

interface Plan {
  id: string;
  name: string;
  price: string;
  seats: number;
}

const plans: Plan[] = [
  { id: 'team', name: '团队版', price: '¥49 / 人 / 月', seats: 50 },
  { id: 'business', name: '企业版', price: '¥99 / 人 / 月', seats: 500 },
  { id: 'enterprise', name: '私有部署', price: '按需报价', seats: Infinity },
];

const channels = [
  { value: 'email', label: '邮件', description: '每天 9:00 汇总一封' },
  { value: 'app', label: '站内信', description: '实时推送，登录后可见' },
  { value: 'sms', label: '短信', description: '只发紧急的待办（需要绑定手机号）', disabled: true },
];

export default _component(() => {
  let plan = _state<string | null>('business');
  let notify = _state(['email', 'app']);
  return () => (
    <Flex direction="column" gap="lg">
      <Field label="套餐">
        <RadioGroup
          _value={_bind(plan)}
          items={plans}
          // 任意数据：toOption 取出值、文字与说明
          toOption={(item) => ({
            value: item.id,
            label: item.name,
            description: `${item.price}，${Number.isFinite(item.seats) ? `最多 ${item.seats} 人` : '人数不限'}`,
          })}
        />
      </Field>
      <Field
        label="通知方式"
        description={
          <>
            已选：<Code>{notify.join('、') || '（无）'}</Code>
          </>
        }
      >
        <CheckboxGroup _value={_bind(notify)} items={channels} />
      </Field>
      <Field label="横排的字符串选项">
        <RadioGroup items={['按日', '按周', '按月']} _value="按周" orientation="horizontal" />
      </Field>
    </Flex>
  );
});
