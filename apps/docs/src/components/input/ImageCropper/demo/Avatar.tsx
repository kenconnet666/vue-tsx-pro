// 上传头像：选好图片先弹出裁剪（Upload 的 transform），确定后交回裁好的 256 × 256 圆形 PNG；取消就不加
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Dialog,
  ImageCropper,
  Upload,
  type ImageCropperHandle,
  type UploadFile,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { watch } from 'vue';

export default _component(() => {
  let files = _state<UploadFile[]>([]);
  let open = _state(false);
  let source = _state('');
  let cropper: ImageCropperHandle | undefined;
  let pending: { file: File; resolve: (file: File | null) => void } | null = null;

  /** 交给 Upload：打开对话框，等用户裁好（或取消） */
  const transform = (file: File) =>
    new Promise<File | null>((resolve) => {
      pending = { file, resolve };
      source = URL.createObjectURL(file);
      open = true;
    });

  async function confirm() {
    if (!pending) return;
    const name = pending.file.name.replace(/\.\w+$/, '') + '.png';
    pending.resolve((await cropper?.toFile(name, { width: 256 })) ?? null);
    pending = null;
  }

  // 关上对话框：没确认就是取消；本地地址用完回收
  watch(
    () => open,
    (now) => {
      if (now) return;
      pending?.resolve(null);
      pending = null;
      URL.revokeObjectURL(source);
    },
  );

  return () => (
    <>
      <Upload
        _value={files}
        accept="image/*"
        listType="picture"
        maxFiles={1}
        transform={transform}
        description="选好后先裁成圆形头像"
      />
      <Dialog _open={open} title="裁剪头像" size="sm" confirmText="使用这张" onConfirm={confirm}>
        {source && (
          <ImageCropper src={source} shape="round" handle={(handle) => (cropper = handle)} />
        )}
      </Dialog>
    </>
  );
});
