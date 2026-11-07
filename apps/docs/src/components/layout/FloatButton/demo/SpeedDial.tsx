// 文件列表的“新建”速拨：点主按钮展开三种新建方式，选了一种就收起
import { FileSpreadsheet, FileText, Plus, Upload } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  FloatButton,
  FloatButtonGroup,
  ItemList,
  ItemListItem,
  Small,
} from '@zerodep-dev/vue-tsx-pro-ui';

const actions = [
  { icon: FileText, label: '新建文档' },
  { icon: FileSpreadsheet, label: '新建表格' },
  { icon: Upload, label: '上传文件' },
];

export default _component(() => {
  let open = _state(false);
  let files = _state(['季度经营分析.docx', '供应商名录.xlsx', '产品路线图.pdf']);
  return () => (
    <Card padding="sm" style={{ contain: 'layout', minHeight: '20rem' }}>
      <ItemList>
        {files.map((name) => (
          <ItemListItem key={name} title={name} />
        ))}
      </ItemList>
      <Small tone="muted" style={{ display: 'block', padding: '0.5em 0.75em' }}>
        共 {files.length} 个文件
      </Small>
      <FloatButtonGroup icon={Plus} aria-label="新建" _open={open}>
        {actions.map((action) => (
          <FloatButton
            key={action.label}
            icon={action.icon}
            aria-label={action.label}
            size="md"
            onClick={() => {
              files = [
                ...files,
                `${action.label.replace(/^新建|^上传/, '未命名')} ${files.length + 1}`,
              ];
              open = false;
            }}
          />
        ))}
      </FloatButtonGroup>
    </Card>
  );
});
