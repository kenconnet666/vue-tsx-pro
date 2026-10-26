import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  existingUploadFile,
  Field,
  Flex,
  Small,
  Upload,
  type UploadFile,
  type UploadHandler,
} from '@zerodep-dev/vue-tsx-pro-ui';

// 演示用的上传：一秒后完成
const upload: UploadHandler = (file, { onProgress }) =>
  new Promise((resolve) => {
    let fraction = 0;
    const timer = setInterval(() => {
      fraction += 0.25;
      onProgress(Math.min(fraction, 1));
      if (fraction >= 1) {
        clearInterval(timer);
        resolve(`/files/${encodeURIComponent(file.name)}`);
      }
    }, 250);
  });

export default _component(() => {
  // 从后端读回来的：之前交过的文件
  let evidence = _state<UploadFile[]>([
    existingUploadFile({ id: 'f-1', name: '方案评审纪要.pdf', size: 482_000, url: '#review' }),
    existingUploadFile({ id: 'f-2', name: '验证报告.pdf', url: '#report' }),
  ]);
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="交付证据" description="被退回后重新提交：上次的文件还在，可以删、可以补">
        <Upload _value={evidence} upload={upload} multiple />
      </Field>
      <Small tone="muted">
        提交的是：
        {evidence
          .filter((item) => item.status === 'done')
          .map((item) => item.url ?? item.response)
          .join('、')}
      </Small>
    </Flex>
  );
});
