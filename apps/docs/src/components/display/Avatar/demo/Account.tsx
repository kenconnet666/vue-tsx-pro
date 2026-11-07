// 账号菜单的触发器：顶栏里是头像 + 名字的胶囊，侧栏底部是带一行说明的整行，空间紧时只剩头像；点开是账号菜单
import { LogOut, Palette, UserRound } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  Flex,
  Menu,
  MenuGroup,
  MenuItem,
  MenuLinkItem,
  Separator,
  Small,
  UserButton,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { members } from './photos';

const styles = css.create({ sidebar: { width: '16rem', maxWidth: '100%' } });

export default _component(() => {
  let signedOut = _state(false);
  const me = members[0]!;
  const menu = () => (
    <>
      <MenuGroup label="xiaoman@example.com">
        <MenuLinkItem icon={UserRound} href="/components/avatar">
          个人资料
        </MenuLinkItem>
        <MenuLinkItem icon={Palette} href="/guide/theming">
          外观设置
        </MenuLinkItem>
      </MenuGroup>
      <Separator decorative={false} />
      <MenuItem icon={LogOut} tone="danger" onAction={() => (signedOut = true)}>
        退出登录
      </MenuItem>
    </>
  );
  return () => (
    <Flex direction="column" gap="md" align="start">
      <Flex align="center" gap="md" wrap>
        <Menu trigger={(props) => <UserButton {...props} name={me.name} src={me.src} />}>
          {menu()}
        </Menu>
        <Menu trigger={(props) => <UserButton {...props} name={me.name} src={me.src} compact />}>
          {menu()}
        </Menu>
      </Flex>
      <Card padding="sm" sx={styles.sidebar}>
        <Menu
          placement="top-start"
          trigger={(props) => (
            <UserButton {...props} name={me.name} src={me.src} description="采购部 · 管理员" />
          )}
        >
          {menu()}
        </Menu>
      </Card>
      <Small tone="muted">{signedOut ? '已退出登录' : '顶栏、只剩头像、侧栏底部三种写法'}</Small>
    </Flex>
  );
});
