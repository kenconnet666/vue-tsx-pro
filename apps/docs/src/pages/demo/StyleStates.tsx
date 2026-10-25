import { Bell, Inbox, Send, Star, Trash2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Badge, Icon, IconButton } from '@vue-tsx-pro/ui';

const folders = [
  { id: 'inbox', label: '收件箱', icon: Inbox, count: 12 },
  { id: 'starred', label: '星标', icon: Star, count: 3 },
  { id: 'sent', label: '已发送', icon: Send, count: 0 },
  { id: 'alerts', label: '通知', icon: Bell, count: 5, disabled: true },
];

/** 标记：挂在行上，行里的删除按钮按这一行的状态显示 */
const row = css.defineMarker('demo-folder-row');
/** 标记：挂在打开文件夹的按钮上，行的底色按它是不是当前项取 */
const open = css.defineMarker('demo-folder-open');

const styles = css.create({
  list: {
    display: 'grid',
    gap: '2px',
    maxWidth: '20rem',
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '_xs',
    paddingInlineEnd: '_xs',
    borderRadius: '_md',
    backgroundColor: {
      default: 'transparent',
      _hover: '_fillHover',
      [css.when.descendant(css.conditions._current, open)]: '_accentSoft',
    },
  },
  open: {
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    gap: '_sm',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    border: 'none',
    borderRadius: '_md',
    backgroundColor: 'transparent',
    font: 'inherit',
    textAlign: 'start',
    cursor: { default: 'pointer', _disabled: 'not-allowed' },
    // 状态写在 DOM 上（aria-current、disabled），样式用条件别名跟着走：渲染里不再拼 current && 样式
    color: { default: '_text', _current: '_accentText', _disabled: '_textDisabled' },
    fontWeight: { default: '_normal', _current: '_semibold' },
    outlineStyle: { default: 'none', _focusVisible: 'solid' },
    outlineWidth: '_sm',
    outlineColor: '_focusRing',
  },
  label: { flexGrow: 1 },
  // 删除按钮平时透明，悬停这一行或行里有焦点时显示（when.* 按标记的状态取样式）
  remove: {
    opacity: {
      default: 0,
      [css.when.ancestor(':hover', row)]: 1,
      [css.when.ancestor(':focus-within', row)]: 1,
    },
  },
});

/** 文件夹列表：当前项、不可用、悬停、键盘聚焦都由 DOM 上的属性决定样式，渲染里没有按状态拼的样式 */
export default _component(() => {
  let current = _state('inbox');
  return () => (
    <nav aria-label="文件夹">
      <ul {...css.attrs(styles.list)}>
        {folders.map((folder) => (
          <li {...css.attrs(styles.row, row)}>
            <button
              type="button"
              aria-current={current === folder.id ? 'page' : undefined}
              disabled={folder.disabled}
              onClick={() => (current = folder.id)}
              {...css.attrs(styles.open, open)}
            >
              <Icon icon={folder.icon} />
              <span {...css.attrs(styles.label)}>{folder.label}</span>
              {folder.count > 0 && <Badge size="xs">{folder.count}</Badge>}
            </button>
            <IconButton
              icon={Trash2}
              size="xs"
              variant="ghost"
              disabled={folder.disabled}
              aria-label={`清空${folder.label}`}
              sx={styles.remove}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
});
