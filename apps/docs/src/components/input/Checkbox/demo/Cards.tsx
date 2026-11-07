// 卡片外观：每个选项是一张卡片，整块可点；选中时边框与底色换成色调色。套餐、配送方式、模板选择这类带说明与价格的选项
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Checkbox,
  CheckboxGroup,
  Field,
  Flex,
  Radio,
  RadioGroup,
  Small,
  Strong,
} from '@zerodep-dev/vue-tsx-pro-ui';

const plans = [
  { id: 'free', name: '个人版', price: '免费', detail: '3 个项目 · 1 GB 存储' },
  { id: 'team', name: '团队版', price: '¥99 / 月', detail: '不限项目 · 50 GB · 10 人' },
  { id: 'business', name: '企业版', price: '¥499 / 月', detail: 'SSO 登录 · 审计日志 · 专属支持' },
];

const addons = [
  { id: 'backup', name: '异地备份', price: '+¥20 / 月', detail: '每天一次，保留 30 天' },
  { id: 'audit', name: '操作审计', price: '+¥50 / 月', detail: '谁在什么时候改了什么' },
];

export default _component(() => {
  let plan = _state<string | null>('team');
  let extras = _state<string[]>(['backup']);
  return () => (
    <Flex direction="column" gap="lg">
      <Field label="套餐">
        <RadioGroup _value={plan} card>
          {plans.map((item) => (
            <Radio
              key={item.id}
              value={item.id}
              description={item.detail}
              end={<Strong>{item.price}</Strong>}
            >
              <Strong>{item.name}</Strong>
            </Radio>
          ))}
        </RadioGroup>
      </Field>
      <Field label="附加服务" description="可以多选，按月计费">
        <CheckboxGroup _value={extras} card orientation="horizontal">
          {addons.map((item) => (
            <Checkbox
              key={item.id}
              value={item.id}
              description={item.detail}
              end={<Small>{item.price}</Small>}
            >
              {item.name}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </Field>
    </Flex>
  );
});
