// 验收照片墙：listType="picture" 是方形缩略图，点开看大图（墙上的图左右切换）；拖动把手调整顺序（第一张是封面），
// 截图后在这里按 Ctrl + V 也能加进来；上传中盖一层进度，名字里带“失败”的图会上传失败、可以重试
import { _component } from '@vue-tsx-pro/tsx';
import {
  existingUploadFile,
  Field,
  Flex,
  Small,
  Upload,
  type UploadFile,
  type UploadHandler,
} from '@vue-tsx-pro/ui';
import { drawings } from '../../../display/Image/demo/drawings';

const upload: UploadHandler = (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let fraction = 0;
    const timer = setInterval(() => {
      fraction += 0.2;
      onProgress(Math.min(fraction, 1));
      if (fraction < 1) return;
      clearInterval(timer);
      if (file.name.includes('失败')) reject(new Error('网络中断'));
      else resolve(`/files/${encodeURIComponent(file.name)}`);
    }, 300);
    signal.addEventListener('abort', () => clearInterval(timer));
  });

export default _component(() => {
  // 已有的照片（上次交的）：用示例图纸当照片
  let photos = _state<UploadFile[]>(
    drawings
      .slice(0, 3)
      .map((drawing) =>
        existingUploadFile({ id: drawing.code, name: `${drawing.title}.svg`, url: drawing.src }),
      ),
  );
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="验收照片" description="最多 8 张，单张不超过 5 MB；第一张是封面">
        <Upload
          value={_bind(photos)}
          upload={upload}
          listType="picture"
          multiple
          accept="image/*"
          maxSize={5_000_000}
          maxFiles={8}
          sortable
          pasteable
        />
      </Field>
      <Small tone="muted">封面：{photos[0]?.name ?? '还没有照片'}</Small>
    </Flex>
  );
});
