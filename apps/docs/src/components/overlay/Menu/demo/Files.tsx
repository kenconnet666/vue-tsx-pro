import {
  Copy,
  Download,
  FileImage,
  FileSpreadsheet,
  FileText,
  Pencil,
  Trash2,
} from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  ButtonBase,
  ContextMenu,
  Flex,
  GridList,
  Icon,
  MenuItem,
  Separator,
  Small,
  type IconData,
} from '@zerodep-dev/vue-tsx-pro-ui';

const files: [string, IconData][] = [
  ['报价单.xlsx', FileSpreadsheet],
  ['合同.pdf', FileText],
  ['首页.png', FileImage],
  ['会议纪要.docx', FileText],
  ['logo.svg', FileImage],
  ['预算.xlsx', FileSpreadsheet],
];

const styles = css.create({
  area: {
    padding: '_md',
    borderWidth: '_xs',
    borderStyle: 'dashed',
    borderColor: '_border',
    borderRadius: '_md',
  },
  file: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '_xs',
    width: '_full',
    paddingBlock: '_md',
    borderRadius: '_md',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
    fontSize: '_sm',
  },
  selected: { backgroundColor: '_accentSoft' },
  icon: { fontSize: '2rem', color: '_textMuted' },
});

export default _component(() => {
  let selected = _state(files[0]![0]);
  let last = _state('');
  const run = (action: string) => () => (last = `${action}“${selected}”`);
  return () => (
    <Flex direction="column" gap="md">
      <ContextMenu
        menu={
          <>
            <MenuItem icon={Download} onAction={run('下载')}>
              下载
            </MenuItem>
            <MenuItem icon={Pencil} shortcut="F2" onAction={run('重命名')}>
              重命名
            </MenuItem>
            <MenuItem icon={Copy} onAction={run('复制')}>
              复制
            </MenuItem>
            <Separator decorative={false} />
            <MenuItem icon={Trash2} tone="danger" onAction={run('删除')}>
              删除
            </MenuItem>
          </>
        }
        sx={styles.area}
      >
        <GridList minItemWidth="9rem" gap="sm" aria-label="文件">
          {files.map(([name, icon]) => (
            <li key={name}>
              <ButtonBase
                sx={[styles.file, selected === name && styles.selected]}
                aria-pressed={selected === name}
                onFocus={() => (selected = name)}
                onContextmenu={() => (selected = name)}
                onClick={() => (selected = name)}
              >
                <Icon icon={icon} sx={styles.icon} />
                {name}
              </ButtonBase>
            </li>
          ))}
        </GridList>
      </ContextMenu>
      <Small tone="muted">{last || '在文件上点右键；键盘聚焦文件后按 Shift+F10 或菜单键'}</Small>
    </Flex>
  );
});
