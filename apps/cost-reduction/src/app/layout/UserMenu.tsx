/**
 * 顶栏的当前用户：头像与姓名，点开切换演示身份（各角色看到的导航、收件箱、能做的事不同）、
 * 把演示数据恢复成初始状态。接统一身份认证后，这里换成个人信息与退出登录
 */
import { Check, RotateCcw } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Avatar,
  ButtonBase,
  Menu,
  MenuGroup,
  MenuItem,
  Separator,
  Small,
  useConfirm,
} from '@vue-tsx-pro/ui';
import { resetDemoData } from '../../api/session';
import { roleNames } from '../../domain/roles';
import { notifyError } from '../feedback';
import { master } from '../master';
import { currentUser, switchUser } from '../session';

const styles = stylex.create({
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_sm',
    paddingInline: '_xs',
    borderRadius: '_md',
  },
  name: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    lineHeight: '_tight',
  },
});

/** 顶栏的当前用户与身份切换 */
export const UserMenu = _component(() => {
  const confirm = useConfirm();

  async function reset() {
    const ok = await confirm({
      title: '恢复演示数据？',
      description: '新建、编辑、推进过的数据都会恢复成初始状态。',
      confirmText: '恢复',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await resetDemoData();
      location.reload();
    } catch (error) {
      notifyError('恢复失败', error);
    }
  }

  return () => {
    const user = currentUser();
    return (
      <Menu
        placement="bottom-end"
        trigger={(trigger) => (
          <ButtonBase
            {...trigger}
            sx={styles.trigger}
            aria-label={`当前身份：${user.name}，切换身份`}
          >
            <Avatar size="sm" name={user.name} />
            <span {...stylex.attrs(styles.name)}>
              <Small>{user.name}</Small>
              <Small tone="muted">{user.roles.map((role) => roleNames[role]).join('、')}</Small>
            </span>
          </ButtonBase>
        )}
      >
        <MenuGroup label="切换演示身份">
          {master().people.map((person) => (
            <MenuItem
              key={person.id}
              icon={person.id === user.id ? Check : undefined}
              description={person.title}
              onAction={() => person.id !== user.id && switchUser(person.id)}
            >
              {person.name}
            </MenuItem>
          ))}
        </MenuGroup>
        <Separator />
        <MenuItem icon={RotateCcw} tone="danger" onAction={() => void reset()}>
          恢复演示数据
        </MenuItem>
      </Menu>
    );
  };
});
