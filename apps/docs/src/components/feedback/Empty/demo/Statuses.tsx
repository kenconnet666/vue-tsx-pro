// 常见的出错页：status 给出图标、色调、状态码与默认文案，显式写的优先
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Card, Flex, LinkButton, Result, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';

type Status = '403' | '404' | '500';

export default _component(() => {
  let status = _state<Status>('404');
  return () => (
    <Flex direction="column" gap="md">
      <ToggleGroup _value={_bind(status)} required size="sm" aria-label="状态">
        <ToggleItem value="403">403 没有权限</ToggleItem>
        <ToggleItem value="404">404 找不到</ToggleItem>
        <ToggleItem value="500">500 服务出错</ToggleItem>
      </ToggleGroup>
      <Card>
        <Result
          key={status}
          status={status}
          // 403 补一句具体缺的权限：显式写的说明优先于语言包的默认说明
          description={
            status === '403'
              ? '查看降本台账需要“财务查看”权限，可以联系你的部门管理员开通。'
              : undefined
          }
          action={
            <Flex gap="sm" justify="center">
              {status === '500' ? (
                <Button size="sm">重试</Button>
              ) : (
                <LinkButton size="sm" href="#">
                  回到首页
                </LinkButton>
              )}
              <Button size="sm" variant="ghost">
                {status === '403' ? '申请权限' : '联系管理员'}
              </Button>
            </Flex>
          }
        />
      </Card>
    </Flex>
  );
});
