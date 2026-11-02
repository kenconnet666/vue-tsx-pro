// 全屏：点顶栏右上角的按钮，顶栏和左侧栏都收起来，正文占满窗口；右上角的按钮或 Esc 退出
import { Box, FileText, House, Users } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Flex, H1, NavItem, NavList, Paragraph, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { AppShell, AppShellBrand } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

export default _component(() => {
  let fullscreen = _state(false);
  return () => (
    <AppShell
      _fullscreen={fullscreen}
      brand={
        <AppShellBrand href="#home" icon={Box}>
          采购协同
        </AppShellBrand>
      }
      header={<Small tone="muted">{fullscreen ? '全屏中' : '点右边的按钮进入全屏'}</Small>}
      sidebar={
        <NavList aria-label="导航">
          <NavItem href="#home" icon={House} active>
            工作台
          </NavItem>
          <NavItem href="#contracts" icon={FileText}>
            合同
          </NavItem>
          <NavItem href="#suppliers" icon={Users}>
            供应商
          </NavItem>
        </NavList>
      }
    >
      <Flex direction="column" gap="md">
        <H1>{fullscreen ? '只看正文' : '工作台'}</H1>
        <Card>
          <Paragraph>
            看大屏、演示、对着一张大表工作时用全屏：顶栏和左侧栏都不占地方。右上角的按钮或 Esc
            退出。
          </Paragraph>
        </Card>
      </Flex>
    </AppShell>
  );
});
