// 上传整个文件夹：对话框里选文件夹，或把文件夹拖进来，里面的文件（含子文件夹）都加进来，列表里显示相对路径
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Field,
  Flex,
  Small,
  Upload,
  type UploadFile,
  type UploadHandler,
} from '@zerodep-dev/vue-tsx-pro-ui';

/** 演示用的上传：半秒后完成；真实场景把 file.webkitRelativePath 一起交给后端，按目录存 */
const upload: UploadHandler = (file, { onProgress }) =>
  new Promise((resolve) => {
    onProgress(0.5);
    setTimeout(() => resolve(file.webkitRelativePath || file.name), 500);
  });

export default _component(() => {
  let files = _state<UploadFile[]>([]);
  return () => (
    <Flex direction="column" gap="sm">
      <Field label="项目资料" description="选一个文件夹，或把文件夹拖进来">
        <Upload _value={files} directory upload={upload} />
      </Field>
      {files.length > 0 && (
        <Small tone="muted">
          共 {files.length} 个文件，{files.filter((item) => item.status === 'done').length} 个已上传
        </Small>
      )}
    </Flex>
  );
});
