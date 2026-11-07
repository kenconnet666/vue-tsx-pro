// 封面：16:9 的框，裁出 1280 × 720 的 JPEG，下面显示结果与大小
import { Crop } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Flex,
  Image,
  ImageCropper,
  Small,
  useFormat,
  type ImageCropperHandle,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { onScopeDispose } from 'vue';
import { drawings } from '../../../display/Image/demo/drawings';

export default _component(() => {
  const format = useFormat();
  let cropper: ImageCropperHandle | undefined;
  let result = _state<{ url: string; size: number } | null>(null);
  onScopeDispose(() => result && URL.revokeObjectURL(result.url));

  async function crop() {
    const blob = await cropper?.toBlob({ width: 1280, type: 'image/jpeg', quality: 0.9 });
    if (!blob) return;
    if (result) URL.revokeObjectURL(result.url);
    result = { url: URL.createObjectURL(blob), size: blob.size };
  }

  return () => (
    <Flex direction="column" gap="sm">
      <ImageCropper
        src={drawings[3]!.src}
        aspect={16 / 9}
        handle={(handle) => (cropper = handle)}
        aria-label="裁剪封面"
      />
      <Flex align="center" gap="sm">
        <Button size="sm" icon={Crop} onClick={() => void crop()}>
          裁出 1280 × 720
        </Button>
        {result && <Small tone="muted">JPEG，{format.fileSize(result.size)}</Small>}
      </Flex>
      {result && <Image src={result.url} alt="裁好的封面" width="100%" height="auto" />}
    </Flex>
  );
});
