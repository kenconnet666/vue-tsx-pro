// 审批时：申请内容整组只读（readonly 写在分组上），只有最后一组“审批意见”能填；标签放在起始边，两组用同一个宽度
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Field,
  Flex,
  FormSection,
  NumberField,
  RadioGroup,
  Radio,
  Textarea,
  TextField,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let decision = _state<string | null>(null);
  let note = _state('');
  return () => (
    <form onSubmit={(event: Event) => event.preventDefault()}>
      <Flex direction="column" gap="lg">
        <FormSection
          title="申请内容"
          description="由申请人填写，审批时只读"
          readonly
          labelPlacement="start"
          labelWidth="6.5em"
        >
          <Field label="项目">
            <TextField _value="显示器支架合并为一体成型" />
          </Field>
          <Field label="编号">
            <TextField _value="PO-2026-0187" />
          </Field>
          <Field label="预计年节省">
            <NumberField _value={174752} suffix="元" />
          </Field>
          <Field label="说明">
            <Textarea _value="两件合并为一件，减少紧固件 36 个，单件减重 0.4 kg。" rows={2} />
          </Field>
        </FormSection>
        <FormSection title="审批意见" labelPlacement="start" labelWidth="6.5em">
          <Field label="结论" required>
            <RadioGroup _value={decision} orientation="horizontal">
              <Radio value="approve">同意</Radio>
              <Radio value="return">退回修改</Radio>
              <Radio value="reject">不同意</Radio>
            </RadioGroup>
          </Field>
          <Field label="意见" required={decision !== 'approve'}>
            <Textarea _value={note} rows={3} placeholder="退回、不同意时写明原因" />
          </Field>
        </FormSection>
        <Flex justify="end">
          <Button disabled={!decision}>提交</Button>
        </Flex>
      </Flex>
    </form>
  );
});
