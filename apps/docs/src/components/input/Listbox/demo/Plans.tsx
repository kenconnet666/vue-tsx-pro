// 单选：选项带图标、说明与分组，不可用的项跳过；required 时再点已选项不会取消
import { Building2, Rocket, Sprout, Users } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Listbox, Small, type ListboxOption } from '@vue-tsx-pro/ui';

const plans: ListboxOption[] = [
  {
    value: 'free',
    label: '免费版',
    icon: Sprout,
    description: '3 个项目、1 GB 存储',
    group: '个人',
  },
  {
    value: 'pro',
    label: '专业版',
    icon: Rocket,
    description: '不限项目、100 GB 存储',
    group: '个人',
  },
  {
    value: 'team',
    label: '团队版',
    icon: Users,
    description: '20 人以内，共享空间',
    group: '团队',
  },
  {
    value: 'enterprise',
    label: '企业版',
    icon: Building2,
    description: '单点登录、审计日志（请联系销售）',
    group: '团队',
    disabled: true,
  },
];

export default _component(() => {
  let plan = _state<string | null>('pro');
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="套餐" required>
        <Listbox items={plans} _value={_bind(plan)} />
      </Field>
      <Small tone="muted">
        选了：{plans.find((option) => option.value === plan)?.label ?? '无'}
      </Small>
    </Flex>
  );
});
