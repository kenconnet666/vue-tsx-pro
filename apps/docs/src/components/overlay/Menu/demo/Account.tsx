import { BookOpen, ChevronDown, CreditCard, LogOut, Palette, UserRound } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import {
  Avatar,
  ButtonBase,
  Flex,
  Icon,
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  Separator,
  Small,
  Strong,
} from '@vue-tsx-pro/ui';

const styles = stylex.create({
  trigger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '_sm',
    paddingBlock: '_xs',
    paddingInlineStart: '_xs',
    paddingInlineEnd: '_sm',
    borderRadius: '_full',
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
  },
  chevron: { color: '_textMuted' },
});

export default _component(() => {
  let signedOut = _state(false);
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Menu
        trigger={(props) => (
          <ButtonBase {...props} sx={styles.trigger}>
            <Avatar name="林小满" size="sm" />
            <Strong size="sm">林小满</Strong>
            <Icon icon={ChevronDown} sx={styles.chevron} />
          </ButtonBase>
        )}
      >
        <MenuGroup label="xiaoman@example.com">
          <MenuLinkItem icon={UserRound} href="/components/avatar">
            个人资料
          </MenuLinkItem>
          <MenuLinkItem icon={Palette} href="/guide/theming">
            外观设置
          </MenuLinkItem>
          <MenuLinkItem icon={CreditCard} href="/components/menu" disabled>
            账单（团队版可用）
          </MenuLinkItem>
        </MenuGroup>
        <Separator decorative={false} />
        <MenuLinkItem icon={BookOpen} href="/guide/getting-started">
          帮助文档
        </MenuLinkItem>
        <MenuItem icon={LogOut} tone="danger" onAction={() => (signedOut = true)}>
          退出登录
        </MenuItem>
      </Menu>
      <Small tone="muted">
        {signedOut ? '已退出登录（示例）' : '链接项是 a 元素：可以中键、右键在新标签页打开'}
      </Small>
    </Flex>
  );
});
