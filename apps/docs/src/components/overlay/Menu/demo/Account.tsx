import { BookOpen, CreditCard, LogOut, Palette, UserRound } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Flex,
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  Separator,
  Small,
  UserButton,
} from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let signedOut = _state(false);
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Menu trigger={(props) => <UserButton {...props} name="林小满" />}>
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
