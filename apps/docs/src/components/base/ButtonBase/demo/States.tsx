import { CloudUpload, Download, Lock, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { ButtonBase, Card, Icon, Small, Spinner, type IconData } from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({
  list: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  row: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    alignItems: 'center',
    columnGap: '_md',
    width: '_full',
    minHeight: '_minTarget',
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderRadius: '_sm',
    backgroundColor: { default: 'transparent', ':hover': '_fill', ':active': '_fillActive' },
    textAlign: 'start',
  },
  // 不可用的样式交给使用方：ButtonBase 只换光标、写上 disabled / aria-disabled 与 data-disabled
  disabled: {
    color: '_textDisabled',
    backgroundColor: { default: 'transparent', ':hover': 'transparent', ':active': 'transparent' },
  },
  hint: { gridColumn: '2' },
});

interface Action {
  icon: IconData;
  label: string;
  hint: string;
}

export default _component(() => {
  let syncing = _state(false);

  const sync = () => {
    syncing = true;
    setTimeout(() => (syncing = false), 2000);
  };

  const content = ({ icon, label, hint }: Action, busy = false) => [
    busy ? <Spinner size="sm" label="同步中" /> : <Icon icon={icon} />,
    <span>{label}</span>,
    <Small tone="muted" sx={styles.hint}>
      {hint}
    </Small>,
  ];

  return () => (
    <Card padding="xs">
      <div {...css.attrs(styles.list)}>
        <ButtonBase sx={styles.row}>
          {content({
            icon: Download,
            label: '导出为 CSV',
            hint: '普通状态：悬停、按下变色，按下有波纹',
          })}
        </ButtonBase>
        <ButtonBase sx={styles.row} loading={syncing} onClick={sync}>
          {content(
            {
              icon: CloudUpload,
              label: syncing ? '正在同步…' : '同步到云端',
              hint: 'loading：点击无效、焦点保留，读屏得知 aria-busy',
            },
            syncing,
          )}
        </ButtonBase>
        <ButtonBase sx={[styles.row, styles.disabled]} disabled focusableWhenDisabled>
          {content({
            icon: Trash2,
            label: '删除仓库',
            hint: 'focusableWhenDisabled：Tab 仍能停在这里，读屏读出“不可用”',
          })}
        </ButtonBase>
        <ButtonBase sx={[styles.row, styles.disabled]} disabled>
          {content({ icon: Lock, label: '转移所有权', hint: 'disabled：原生不可用，Tab 跳过' })}
        </ButtonBase>
      </div>
    </Card>
  );
});
