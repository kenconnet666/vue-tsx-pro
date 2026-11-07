// 选好就上传：一打开就有几张图在不同的状态——已上传、正在上传（看进度）、上传失败（可以重试）、不合要求
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

/** 假的上传：每 150ms 进 6%；名字里带“断网”的第一次在中途失败，重试就好；移除时经 signal 中止 */
const tried = new Set<string>();
const fakeUpload: UploadHandler = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    const fails = file.name.includes('断网') && !tried.has(file.name);
    tried.add(file.name);
    let progress = 0;
    const timer = setInterval(() => {
      progress = Math.min(progress + 0.06, 1);
      onProgress(progress);
      if (fails && progress > 0.5) {
        clearInterval(timer);
        reject(new Error('网络中断'));
      } else if (progress >= 1) {
        clearInterval(timer);
        resolve({ url: `https://cdn.example.com/${encodeURIComponent(file.name)}` });
      }
    }, 150);
    signal.addEventListener('abort', () => {
      clearInterval(timer);
      reject(signal.reason);
    });
  });

/** 演示用的图片文件（内容不重要） */
const image = (name: string, size: number) =>
  new File([new Uint8Array(size)], name, { type: 'image/jpeg' });

export default _component(() => {
  let photos = _state<UploadFile[]>([
    existingUploadFile({ id: 'cover', name: '主图.jpg', size: 864_000, url: '#cover' }),
    // 父级放进来的待上传文件：给了 upload 时马上开始上传
    {
      id: 'side',
      name: '侧面.jpg',
      size: 1_200_000,
      file: image('侧面.jpg', 1_200_000),
      status: 'selected',
    },
    {
      id: 'detail',
      name: '细节（断网）.jpg',
      size: 940_000,
      file: image('细节（断网）.jpg', 940_000),
      status: 'selected',
    },
    {
      id: 'raw',
      name: '原图.tif',
      size: 18_500_000,
      status: 'error',
      error: '不能超过 2 MB',
      rejected: true,
    },
  ]);
  const count = (match: (photo: UploadFile) => boolean) => photos.filter(match).length;
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="商品图片" description="最多 6 张，每张不超过 2 MB">
        <Upload
          _value={photos}
          multiple
          accept="image/*"
          maxSize={2_000_000}
          maxFiles={6}
          upload={fakeUpload}
        />
      </Field>
      <Small tone="muted">
        {count((photo) => photo.status === 'done')} 张已上传 ·{' '}
        {count((photo) => photo.status === 'uploading')} 张上传中 ·{' '}
        {count((photo) => photo.status === 'error' && !photo.rejected)} 张失败（可以重试）·{' '}
        {count((photo) => !!photo.rejected)} 张不合要求
      </Small>
    </Flex>
  );
});
