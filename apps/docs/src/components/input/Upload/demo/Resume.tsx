import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Code,
  Field,
  Flex,
  Small,
  TextField,
  Upload,
  type UploadFile,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  let resume = _state<UploadFile[]>([]);
  let submitted = _state('');
  // 原生提交：写了 name 的 Upload 带着隐藏的 file input，FormData 里就有文件
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.target as HTMLFormElement);
    submitted = [...data.entries()]
      .map(([key, value]) => `${key}=${value instanceof File ? `File(${value.name})` : value}`)
      .join('  ');
  };
  return () => (
    <form onSubmit={submit}>
      <Flex direction="column" gap="md">
        <Field label="姓名">
          <TextField name="name" _value="林小满" />
        </Field>
        <Field label="简历" required description="PDF 或 Word，不超过 10 MB；提交时一起上传">
          <Upload _value={resume} name="resume" accept=".pdf,.doc,.docx" maxSize={10_000_000} />
        </Field>
        <Flex justify="end">
          <Button type="submit" disabled={!resume.some((file) => !file.rejected)}>
            投递
          </Button>
        </Flex>
        {submitted && (
          <Small tone="muted">
            FormData：<Code>{submitted}</Code>
          </Small>
        )}
      </Flex>
    </form>
  );
});
