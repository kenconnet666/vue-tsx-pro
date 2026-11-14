// 表单页：分组的长表单（FormSection）、明细的上传、底部吸住的操作栏（ActionBar）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  DatePicker,
  Field,
  Flex,
  FormSection,
  GridItem,
  NumberField,
  RadioGroup,
  Radio,
  Select,
  Textarea,
  TextField,
  Upload,
  type UploadFile,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { ActionBar, PageHeader } from '@zerodep-dev/vue-tsx-pro-ui/patterns';
import { categories, suppliers } from '../template-data';
import { TemplateShell } from '../template-shell';

const styles = css.create({ form: { display: 'flex', flexDirection: 'column', gap: '_xl' } });

export default _component(() => {
  let title = _state('');
  let category = _state<string | null>(null);
  let supplier = _state<string | null>(null);
  let budget = _state<number | null>(null);
  let urgency = _state('normal');
  let reason = _state('');
  let files = _state<UploadFile[]>([]);
  return () => (
    <TemplateShell current="create">
      <Flex direction="column" gap="lg">
        <PageHeader
          title="新建采购申请"
          description="提交后先由部门经理审批，金额超过 5 万元时加签财务。"
        />
        <form {...css.attrs(styles.form)} onSubmit={(event: Event) => event.preventDefault()}>
          <FormSection title="基本信息" columns={2} headingLevel={2}>
            <Field label="申请标题" required>
              <TextField _value={title} placeholder="例如：二号线导轨更换" />
            </Field>
            <Field label="品类" required>
              <Select items={categories} _value={category} placeholder="选择品类" />
            </Field>
            <Field label="建议供应商">
              <Select items={suppliers} _value={supplier} placeholder="不限" clearable />
            </Field>
            <Field label="预算" description="含税，单位元">
              <NumberField _value={budget} min={0} step={1000} />
            </Field>
          </FormSection>
          <FormSection title="交付" columns={2} headingLevel={2}>
            <Field label="期望到货">
              <DatePicker />
            </Field>
            <Field label="紧急程度">
              <RadioGroup _value={urgency} orientation="horizontal">
                <Radio value="normal">一般</Radio>
                <Radio value="urgent">加急</Radio>
              </RadioGroup>
            </Field>
            <GridItem span="full">
              <Field label="申请理由">
                <Textarea _value={reason} rows={3} />
              </Field>
            </GridItem>
          </FormSection>
          <FormSection title="附件" headingLevel={2}>
            <Upload _value={files} multiple description="报价单、图纸，单个不超过 20 MB" />
          </FormSection>
          <ActionBar start="草稿每 30 秒自动保存">
            <Button variant="ghost" tone="neutral">
              取消
            </Button>
            <Button variant="outline" tone="neutral">
              保存草稿
            </Button>
            <Button type="submit">提交审批</Button>
          </ActionBar>
        </form>
      </Flex>
    </TemplateShell>
  );
});
