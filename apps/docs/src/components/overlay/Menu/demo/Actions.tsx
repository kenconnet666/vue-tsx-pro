import {
  Archive,
  Copy,
  FileText,
  Folder,
  FolderInput,
  MoreHorizontal,
  Pencil,
  Share2,
  Trash2,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Card,
  Flex,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSub,
  Separator,
  Small,
  Strong,
} from '@vue-tsx-pro/ui';

const folders = ['设计稿', '会议纪要', '归档 / 2025'];

const styles = stylex.create({
  icon: { color: '_textMuted', fontSize: '1.5rem' },
});

export default _component(() => {
  let last = _state('');
  const run = (action: string) => () => (last = action);
  return () => (
    <Flex direction="column" gap="md">
      <Card padding="sm">
        <Flex align="center" gap="md">
          <Icon icon={FileText} sx={styles.icon} />
          <Flex direction="column" grow>
            <Strong>第三季度经营报告.docx</Strong>
            <Small tone="muted">周一航 · 昨天 18:20 修改 · 2.4 MB</Small>
          </Flex>
          <Menu
            placement="bottom-end"
            trigger={(props) => (
              <IconButton {...props} icon={MoreHorizontal} aria-label="更多操作" />
            )}
          >
            <MenuItem icon={Pencil} shortcut="F2" onAction={run('重命名')}>
              重命名
            </MenuItem>
            <MenuItem icon={Copy} shortcut="Ctrl+D" onAction={run('创建副本')}>
              创建副本
            </MenuItem>
            <MenuSub icon={FolderInput} label="移动到">
              {folders.map((folder) => (
                <MenuItem key={folder} icon={Folder} onAction={run(`移动到“${folder}”`)}>
                  {folder}
                </MenuItem>
              ))}
            </MenuSub>
            <MenuItem icon={Share2} onAction={run('分享')}>
              分享
            </MenuItem>
            <MenuItem icon={Archive} disabled>
              归档（没有权限）
            </MenuItem>
            <Separator decorative={false} />
            <MenuItem icon={Trash2} tone="danger" onAction={run('删除')}>
              删除
            </MenuItem>
          </Menu>
        </Flex>
      </Card>
      <Small tone="muted">{last ? `执行了：${last}` : '点右侧的 … 打开菜单'}</Small>
    </Flex>
  );
});
