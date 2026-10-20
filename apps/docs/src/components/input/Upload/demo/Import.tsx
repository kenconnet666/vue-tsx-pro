import { FileSpreadsheet } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Alert, FileDrop, Flex, Small } from '@vue-tsx-pro/ui';

export default _component(() => {
  let imported = _state('');
  let rejected = _state('');
  // FileDrop 只负责选文件：读文件、校验、导入都由自己决定
  const onFiles = async ([file]: File[]) => {
    if (!file) return;
    rejected = '';
    const rows = (await file.text()).split(/\r?\n/).filter(Boolean).length;
    imported = `${file.name}：${rows} 行`;
  };
  return () => (
    <Flex direction="column" gap="md">
      <FileDrop
        accept=".csv,text/csv"
        propsIcon={{ icon: FileSpreadsheet }}
        description="第一行是表头：姓名、手机号、部门"
        onFiles={(files) => void onFiles(files)}
        onReject={(files) => (rejected = files.map((file) => file.name).join('、'))}
      />
      {rejected && (
        <Alert tone="danger" title="不是 CSV 文件">
          {rejected}
        </Alert>
      )}
      {imported && <Small tone="muted">已读取 {imported}</Small>}
    </Flex>
  );
});
