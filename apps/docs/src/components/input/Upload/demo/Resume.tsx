// 随表单提交、带着已有文件：被退回后重新提交，上次交的文件（existingUploadFile）还在、可以删；新选的停在“已选择”，
// 提交时一起交——写了 name 的 Upload 带着隐藏的 file input，FormData 里就有新文件，已有文件按 id 另外交
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Code,
  existingUploadFile,
  Field,
  Flex,
  Small,
  Textarea,
  Upload,
  type UploadFile,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let evidence = _state<UploadFile[]>([
    existingUploadFile({ id: 'f-1', name: '方案评审纪要.pdf', size: 482_000, url: '#review' }),
    existingUploadFile({ id: 'f-2', name: '验证报告.pdf', url: '#report' }),
  ]);
  let note = _state('补上了试验报告的第 3 节。');
  let submitted = _state('');
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    const kept = evidence.filter((item) => item.status === 'done').map((item) => item.id);
    const files = data
      .getAll('evidence')
      .map((value) => (value instanceof File ? value.name : value));
    submitted = `保留 ${kept.join('、') || '（无）'}；新文件 ${files.join('、') || '（无）'}`;
  };
  return () => (
    <form onSubmit={submit}>
      <Flex direction="column" gap="md">
        <Field label="交付证据" description="上次的文件还在，可以删、可以补；新选的提交时一起交">
          <Upload _value={evidence} name="evidence" multiple accept=".pdf,.doc,.docx" />
        </Field>
        <Field label="说明">
          <Textarea _value={note} name="note" rows={2} />
        </Field>
        <Flex justify="end">
          <Button type="submit">重新提交</Button>
        </Flex>
        {submitted && (
          <Small tone="muted">
            提交：<Code>{submitted}</Code>
          </Small>
        )}
      </Flex>
    </form>
  );
});
