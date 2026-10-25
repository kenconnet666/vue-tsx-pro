import { Bell, Lock, Palette } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Accordion, AccordionItem, Badge, Flex, Icon, Small, Switch, Text } from '@vue-tsx-pro/ui';

const title = (icon: typeof Bell, label: string, count?: number) => (
  <Flex align="center" gap="sm">
    <Icon icon={icon} />
    <Text weight="medium">{label}</Text>
    {count != null && (
      <Badge radius="full" size="xs">
        {count}
      </Badge>
    )}
  </Flex>
);

export default _component(() => {
  // 多开：每项独立展开收起，value 是数组
  let open = _state(['notify', 'privacy']);
  let email = _state(true);
  let push = _state(false);
  let publicProfile = _state(true);
  let compact = _state(false);
  return () => (
    <Flex direction="column" gap="sm">
      {/* 文档里示例的标题是 h2，各项标题接着用 h3 */}
      <Accordion selectionMode="multiple" _value={_bind(open)} headingLevel={3} aria-label="设置">
        <AccordionItem value="notify" title={title(Bell, '通知', 2)}>
          <Flex direction="column" gap="sm">
            <Switch _checked={_bind(email)}>邮件通知</Switch>
            <Switch _checked={_bind(push)}>推送通知</Switch>
          </Flex>
        </AccordionItem>
        <AccordionItem value="privacy" title={title(Lock, '隐私')}>
          <Switch _checked={_bind(publicProfile)}>公开个人主页</Switch>
        </AccordionItem>
        <AccordionItem value="appearance" title={title(Palette, '外观')}>
          <Switch _checked={_bind(compact)}>紧凑模式</Switch>
        </AccordionItem>
      </Accordion>
      <Small tone="muted">展开着：{open.join('、') || '无'}</Small>
    </Flex>
  );
});
