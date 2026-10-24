import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Checkbox, CheckboxGroup, Field, Flex, Small } from '@vue-tsx-pro/ui';

const permissions = [
  ['orders:read', '查看订单'],
  ['orders:write', '修改订单'],
  ['refunds', '处理退款'],
  ['reports', '导出报表'],
] as const;

const styles = css.create({ group: { paddingInlineStart: '1.75em' } });

export default _component(() => {
  let granted = _state<string[]>(['orders:read', 'reports']);
  let channels = _state<string[]>(['email']);
  let agreed = _state(false);
  return () => {
    const all = granted.length === permissions.length;
    const some = granted.length > 0 && !all;
    return (
      <Flex direction="column" gap="lg">
        <Card padding="sm">
          <Flex direction="column" gap="sm">
            {/* 全选：部分勾选时 indeterminate，读屏念“部分选中” */}
            <Checkbox
              checked={all}
              indeterminate={some}
              onChange={() => (granted = all ? [] : permissions.map(([value]) => value))}
            >
              订单管理员（全部权限）
            </Checkbox>
            <CheckboxGroup value={_bind(granted)} aria-label="权限" sx={styles.group}>
              {permissions.map(([value, label]) => (
                <Checkbox key={value} value={value}>
                  {label}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </Flex>
        </Card>
        <Field
          label="通知方式"
          description="至少选一种"
          error={channels.length ? undefined : '请至少选一种'}
        >
          <CheckboxGroup value={_bind(channels)} name="channels" orientation="horizontal">
            <Checkbox value="email">邮件</Checkbox>
            <Checkbox value="sms">短信</Checkbox>
            <Checkbox value="push">App 推送</Checkbox>
            <Checkbox value="phone" disabled>
              电话（企业版）
            </Checkbox>
          </CheckboxGroup>
        </Field>
        <Flex direction="column" gap="xs">
          <Checkbox checked={_bind(agreed)} tone="success">
            我已阅读并同意《服务条款》
          </Checkbox>
          <Small tone="muted">已授予：{granted.join('、') || '无'}</Small>
        </Flex>
      </Flex>
    );
  };
});
