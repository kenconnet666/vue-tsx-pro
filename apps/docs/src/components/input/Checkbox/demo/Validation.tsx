// 必选与出错：提交时才显示错误；Field 的 error 让整组标红，读屏把错误作为说明念出
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Checkbox, CheckboxGroup, Field, Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let channels = _state<string[]>([]);
  let agreed = _state(false);
  let submitted = _state(false);
  let done = _state(false);
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    submitted = true;
    done = channels.length > 0 && agreed;
  };
  return () => (
    <form onSubmit={onSubmit} novalidate>
      <Flex direction="column" gap="lg" align="start">
        <Field
          label="通知方式"
          required
          error={submitted && channels.length === 0 ? '至少选一种通知方式' : undefined}
        >
          <CheckboxGroup _value={channels} orientation="horizontal">
            <Checkbox value="email">邮件</Checkbox>
            <Checkbox value="sms">短信</Checkbox>
            <Checkbox value="inbox">站内信</Checkbox>
          </CheckboxGroup>
        </Field>
        <Field error={submitted && !agreed ? '请先同意服务条款' : undefined}>
          <Checkbox _checked={agreed} required>
            我已阅读并同意服务条款
          </Checkbox>
        </Field>
        <Flex gap="sm" align="center">
          <Button type="submit">保存设置</Button>
          {done && <Small tone="success">已保存</Small>}
        </Flex>
      </Flex>
    </form>
  );
});
