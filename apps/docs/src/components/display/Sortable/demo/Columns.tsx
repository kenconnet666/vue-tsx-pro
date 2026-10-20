import { CalendarDays, Hash, Mail, Phone, User } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Icon, Small, Sortable, Text, type IconData } from '@vue-tsx-pro/ui';

interface Column {
  key: string;
  label: string;
  icon: IconData;
}

export default _component(() => {
  let columns = _state<Column[]>([
    { key: 'id', label: '编号', icon: Hash },
    { key: 'name', label: '姓名', icon: User },
    { key: 'phone', label: '电话', icon: Phone },
    { key: 'email', label: '邮箱', icon: Mail },
    { key: 'joined', label: '入职日期', icon: CalendarDays },
  ]);
  return () => (
    <Flex direction="column" gap="md">
      <Sortable
        items={_bind(columns)}
        orientation="horizontal"
        getKey={(column) => column.key}
        getLabel={(column) => column.label}
        aria-label="表格列的顺序"
      >
        {(column) => (
          <Flex align="center" gap="xs">
            <Icon icon={column.icon} />
            <Text>{column.label}</Text>
          </Flex>
        )}
      </Sortable>
      <Small tone="muted">表头：{columns.map((column) => column.label).join(' | ')}</Small>
    </Flex>
  );
});
