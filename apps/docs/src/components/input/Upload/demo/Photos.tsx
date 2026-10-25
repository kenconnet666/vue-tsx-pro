import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Small, Upload, type UploadFile, type UploadHandler } from '@vue-tsx-pro/ui';

/** 假的上传：每 120ms 进 8%，三分之一的概率在中途失败；移除时经 signal 中止 */
const fakeUpload: UploadHandler = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let progress = 0;
    const fails = Math.random() < 0.33;
    const timer = setInterval(() => {
      progress = Math.min(progress + 0.08, 1);
      onProgress(progress);
      if (fails && progress > 0.6) {
        clearInterval(timer);
        reject(new Error('网络中断'));
      } else if (progress >= 1) {
        clearInterval(timer);
        resolve({ url: `https://cdn.example.com/${encodeURIComponent(file.name)}` });
      }
    }, 120);
    signal.addEventListener('abort', () => {
      clearInterval(timer);
      reject(signal.reason);
    });
  });

export default _component(() => {
  let photos = _state<UploadFile[]>([]);
  const count = (match: (photo: UploadFile) => boolean) => photos.filter(match).length;
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="商品图片" description="最多 6 张，每张不超过 2 MB">
        <Upload
          _value={_bind(photos)}
          multiple
          accept="image/*"
          maxSize={2_000_000}
          maxFiles={6}
          upload={fakeUpload}
        />
      </Field>
      <Small tone="muted">
        {count((photo) => photo.status === 'done')} 张已上传 ·{' '}
        {count((photo) => photo.status === 'error' && !photo.rejected)} 张失败（可以重试）·{' '}
        {count((photo) => !!photo.rejected)} 张不合要求
      </Small>
    </Flex>
  );
});
