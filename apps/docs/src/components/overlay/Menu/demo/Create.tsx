import { FileSpreadsheet, FileText, FolderPlus, Plus, Presentation, Upload } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Flex,
  Menu,
  MenuGroup,
  MenuItem,
  Separator,
  Small,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let created = _state('');
  const create = (kind: string) => () => (created = kind);
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Menu
        trigger={(props) => (
          <Button {...props} icon={Plus}>
            新建
          </Button>
        )}
      >
        <MenuGroup label="文档">
          <MenuItem icon={FileText} description="空白的文字文档" onAction={create('文档')}>
            文档
          </MenuItem>
          <MenuItem icon={FileSpreadsheet} description="行列、公式与图表" onAction={create('表格')}>
            表格
          </MenuItem>
          <MenuItem
            icon={Presentation}
            description="一页页的幻灯片，可以全屏演示"
            onAction={create('演示文稿')}
          >
            演示文稿
          </MenuItem>
        </MenuGroup>
        <Separator decorative={false} />
        <MenuItem icon={FolderPlus} onAction={create('文件夹')}>
          文件夹
        </MenuItem>
        <MenuItem icon={Upload} onAction={create('上传的文件')}>
          上传文件…
        </MenuItem>
      </Menu>
      <Small tone="muted">
        {created ? `新建了：${created}` : '说明文字在名称下方，读屏念完名称再念说明'}
      </Small>
    </Flex>
  );
});
