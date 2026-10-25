// 表单提交（name）、松手时才提交的 onValueCommit、不可用
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Code, Field, Flex, Slider, Small } from '@vue-tsx-pro/ui';

export default _component(() => {
  let volume = _state(60);
  let committed = _state(60);
  let submitted = _state('');
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    submitted = JSON.stringify(Object.fromEntries(new FormData(event.target as HTMLFormElement)));
  };
  return () => (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="lg">
        <Field label="提醒音量" description={`拖动中 ${volume}，松手后才保存：${committed}`}>
          <Slider
            _value={_bind(volume)}
            name="volume"
            onValueCommit={(value) => (committed = value)}
          />
        </Field>
        <Field label="系统音量" disabled description="由系统设置控制">
          <Slider _value={40} />
        </Field>
        <Flex gap="sm" align="center" wrap>
          <Button type="submit" variant="outline" tone="neutral">
            提交
          </Button>
          {submitted ? <Code>{submitted}</Code> : <Small tone="muted">name 随表单提交当前值</Small>}
        </Flex>
      </Flex>
    </form>
  );
});
