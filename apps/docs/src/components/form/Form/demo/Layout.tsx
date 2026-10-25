// 标签放在起始边：Form 上统一设置，标签一列右对齐、控件一列，按第一行文字的基线对齐；
// readonly / disabled 写在 Form 上，所有字段与控件（含勾选、开关、滑块、分段）一起只读或不可用
import { _component } from '@vue-tsx-pro/tsx';
import {
  Card,
  Checkbox,
  CheckboxGroup,
  Field,
  Flex,
  Form,
  NumberField,
  Radio,
  RadioGroup,
  Switch,
  Textarea,
  TextField,
  ToggleGroup,
  ToggleItem,
  useForm,
} from '@vue-tsx-pro/ui';

type Mode = 'edit' | 'readonly' | 'disabled';

export default _component(() => {
  let mode = _state<Mode>('readonly');
  const form = useForm({
    initial: {
      name: '华东门店陈列改造',
      category: 'display',
      scope: 'all',
      funding: ['budget', 'special'],
      notify: false,
      stores: 40,
      description:
        '收银台移到入口一侧，高频商品移到视线高度；货架由五层减为四层，单店节省陈列物料约 3000 元。',
    },
  });

  return () => (
    <Card
      header={
        <Flex align="center" justify="between" gap="md" wrap>
          <strong>项目基本信息</strong>
          <ToggleGroup _value={mode} required size="sm" aria-label="表单状态">
            <ToggleItem value="edit">编辑</ToggleItem>
            <ToggleItem value="readonly">只读</ToggleItem>
            <ToggleItem value="disabled">不可用</ToggleItem>
          </ToggleGroup>
        </Flex>
      }
    >
      <Form
        controller={form}
        labelPlacement="start"
        labelWidth="6.5em"
        readonly={mode === 'readonly'}
        disabled={mode === 'disabled'}
      >
        <Flex direction="column" gap="md">
          <Field label="项目名称" required>
            <TextField _value={form.values.name} />
          </Field>
          <Field label="改造类型" required>
            <RadioGroup _value={form.values.category} orientation="horizontal">
              <Radio value="display">陈列调整</Radio>
              <Radio value="device">设备更新</Radio>
              <Radio value="process">流程优化</Radio>
            </RadioGroup>
          </Field>
          <Field label="执行范围" required>
            <ToggleGroup _value={form.values.scope} required size="sm">
              <ToggleItem value="all">全部门店</ToggleItem>
              <ToggleItem value="pilot">试点门店</ToggleItem>
            </ToggleGroup>
          </Field>
          <Field label="经费来源" description="可多选">
            <CheckboxGroup _value={form.values.funding} orientation="horizontal">
              <Checkbox value="budget">年度预算</Checkbox>
              <Checkbox value="special">专项资金</Checkbox>
              <Checkbox value="brand">品牌合作</Checkbox>
              <Checkbox value="self">其他自筹</Checkbox>
            </CheckboxGroup>
          </Field>
          <Field label="涉及门店">
            <NumberField _value={form.values.stores} min={0} suffix="家" />
          </Field>
          <Field label="通知门店">
            <Switch _checked={form.values.notify}>开工前三天通知店长</Switch>
          </Field>
          <Field label="简要描述" required description="说明改造内容与节省金额的计算依据">
            <Textarea _value={form.values.description} rows={3} />
          </Field>
        </Flex>
      </Form>
    </Card>
  );
});
