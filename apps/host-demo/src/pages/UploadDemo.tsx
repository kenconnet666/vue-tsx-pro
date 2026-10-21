// /base 页上的上传演示：模拟的上传函数（进度一点点涨，文件名带 fail 的失败一次，重试后成功）与只选不传的 FileDrop
import { _component } from '@vue-tsx-pro/tsx';
import { FileDrop, Flex, Text, Upload, type UploadFile, type UploadHandler } from '@vue-tsx-pro/ui';

/**
 * 模拟上传：每 120ms 涨 20%；文件名带 fail 的第一次失败。
 * 失败过的文件按演示实例记：每次挂载重新来过（测试重试时也一样）
 */
function fakeUpload(): UploadHandler {
  const failedOnce = new Set<string>();
  return (file, { onProgress, signal }) =>
    new Promise((resolve, reject) => {
      let progress = 0;
      const timer = setInterval(() => {
        progress += 0.2;
        onProgress(Math.min(progress, 1));
        if (progress < 1) return;
        clearInterval(timer);
        if (file.name.includes('fail') && !failedOnce.has(file.name)) {
          failedOnce.add(file.name);
          reject(new Error('服务器开小差了'));
        } else resolve({ url: `/files/${encodeURIComponent(file.name)}` });
      }, 120);
      signal.addEventListener('abort', () => clearInterval(timer));
    });
}

export const UploadDemo = _component(() => {
  const upload = fakeUpload();
  let files = _state<UploadFile[]>([]);
  let picked = _state<string[]>([]);

  return () => (
    <Flex direction="column" gap="md">
      <Upload
        class="upload-demo"
        value={_bind(files)}
        multiple
        maxSize={2_000_000}
        upload={upload}
        name="attachments"
        description="单个文件不超过 2 MB；文件名带 fail 的会失败一次"
      />
      <FileDrop
        propsRoot={{ class: 'file-drop-demo' }}
        accept="image/*"
        multiple
        onFiles={(list) => (picked = list.map((file) => file.name))}
        description="只接受图片，不上传"
      />
      <Text tone="muted" size="sm" class="file-drop-summary">
        选到：{picked.join('、') || '无'}
      </Text>
    </Flex>
  );
});
