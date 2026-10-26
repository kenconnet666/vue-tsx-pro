import { CalendarDays, Hash, Mail, Phone, User } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Flex,
  Icon,
  ScrollArea,
  Small,
  Sortable,
  Text,
  type IconData,
} from '@zerodep-dev/vue-tsx-pro-ui';

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
      {/* 项多、放不下时横向滚动；拖到边缘会自动滚动 */}
      <ScrollArea axis="x">
        <Sortable
          _items={columns}
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
      </ScrollArea>
      <Small tone="muted">表头：{columns.map((column) => column.label).join(' | ')}</Small>
    </Flex>
  );
});
