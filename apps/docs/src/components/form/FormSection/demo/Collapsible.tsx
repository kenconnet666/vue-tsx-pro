// 可收起的分组：不常填的“高级选项”默认收起；标题栏结束边放这一组的操作（添加一行）；
// 重复的行只在第一行显示列名，其余行 labelHidden（读屏照样念）
import { Plus, Trash2 } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Field,
  Flex,
  FormSection,
  IconButton,
  Select,
  Switch,
  TextField,
} from '@vue-tsx-pro/ui';

export default _component(() => {
  let contacts = _state([
    { name: '周岚', role: '销售经理', phone: '13800001234' },
    { name: '陈默', role: '质量工程师', phone: '13900005678' },
  ]);
  let advancedOpen = _state(false);
  let notify = _state(true);
  let channel = _state<string | null>('email');

  return () => (
    <form onSubmit={(event: Event) => event.preventDefault()}>
      <Flex direction="column" gap="lg">
        <FormSection
          title="联系人"
          description={`${contacts.length} 位，至少保留一位`}
          extra={
            <Button
              size="sm"
              variant="soft"
              icon={Plus}
              onClick={() => (contacts = [...contacts, { name: '', role: '', phone: '' }])}
            >
              添加联系人
            </Button>
          }
        >
          {contacts.map((contact, index) => (
            <Flex key={index} align="end" gap="sm">
              <Field label="姓名" labelHidden={index > 0}>
                <TextField _value={_bind(contact.name)} />
              </Field>
              <Field label="职务" labelHidden={index > 0}>
                <TextField _value={_bind(contact.role)} />
              </Field>
              <Field label="手机" labelHidden={index > 0}>
                <TextField _value={_bind(contact.phone)} inputmode="numeric" />
              </Field>
              <IconButton
                icon={Trash2}
                variant="ghost"
                tone="neutral"
                aria-label={`删除第 ${index + 1} 位联系人`}
                disabled={contacts.length === 1}
                onClick={() => (contacts = contacts.filter((_, at) => at !== index))}
              />
            </Flex>
          ))}
        </FormSection>
        <FormSection
          title="高级选项"
          description="通知方式、对接系统；不填时按默认"
          collapsible
          _open={_bind(advancedOpen)}
          columns={2}
          minColumnWidth="14em"
        >
          <Field label="状态变更时通知">
            <Switch _checked={_bind(notify)}>通知联系人</Switch>
          </Field>
          <Field label="通知方式">
            <Select
              _value={_bind(channel)}
              disabled={!notify}
              items={[
                { value: 'email', label: '邮件' },
                { value: 'sms', label: '短信' },
                { value: 'portal', label: '供应商门户站内信' },
              ]}
            />
          </Field>
        </FormSection>
      </Flex>
    </form>
  );
});
