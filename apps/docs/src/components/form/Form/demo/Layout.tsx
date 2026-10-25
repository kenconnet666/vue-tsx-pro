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
      category: 'design',
      install: 'required',
      funding: ['quality', 'certification'],
      needSb: false,
      flights: 40,
      description:
        '包装由两层合并为一层，减少胶带用量 36%；纸箱由五层瓦楞换为三层，单箱减重 0.3 kg。',
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
          <Field label="任务类别" required>
            <RadioGroup _value={form.values.category} orientation="horizontal">
              <Radio value="design">设计优化</Radio>
              <Radio value="source">多供应商</Radio>
              <Radio value="process">工艺优化</Radio>
            </RadioGroup>
          </Field>
          <Field label="安装类型" required>
            <ToggleGroup _value={form.values.install} required size="sm">
              <ToggleItem value="required">必装</ToggleItem>
              <ToggleItem value="optional">选装</ToggleItem>
            </ToggleGroup>
          </Field>
          <Field label="经费来源" description="可多选">
            <CheckboxGroup _value={form.values.funding} orientation="horizontal">
              <Checkbox value="quality">精品工程</Checkbox>
              <Checkbox value="certification">适航取证</Checkbox>
              <Checkbox value="plateau">高原型项目</Checkbox>
              <Checkbox value="self">其他自筹</Checkbox>
            </CheckboxGroup>
          </Field>
          <Field label="贯彻架次">
            <NumberField _value={form.values.flights} min={0} />
          </Field>
          <Field label="SB 贯彻">
            <Switch _checked={form.values.needSb}>需要 SB 贯彻航线架次</Switch>
          </Field>
          <Field label="简要描述" required description="说明更改内容与节省金额的计算依据">
            <Textarea _value={form.values.description} rows={3} />
          </Field>
        </Flex>
      </Form>
    </Card>
  );
});
