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
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  ContextMenu,
  Flex,
  Icon,
  MenuItem,
  Radio,
  RadioGroup,
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
  icon: { fontSize: '1.5rem', color: '_textMuted' },
});

export default _component(() => {
  // 文件是一组单选卡片：方向键换选中的文件，右键先选中再弹菜单
  let selected = _state<string | null>(files[0]![0]);
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
      >
        <RadioGroup
          _value={selected}
          card
          orientation="horizontal"
          minItemWidth="11rem"
          aria-label="文件"
        >
          {files.map(([name, icon]) => (
            <Radio key={name} value={name} propsRoot={{ onContextmenu: () => (selected = name) }}>
              <Flex align="center" gap="sm">
                <Icon icon={icon} sx={styles.icon} />
                {name}
              </Flex>
            </Radio>
          ))}
        </RadioGroup>
      </ContextMenu>
      <Small tone="muted">{last || '在文件上点右键；键盘聚焦文件后按 Shift+F10 或菜单键'}</Small>
    </Flex>
  );
});
