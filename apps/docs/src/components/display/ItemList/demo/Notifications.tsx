// 通知列表：整条是链接（href，走路由适配），点哪里都打开；结束边的“标为已读”是独立的按钮，叠在上面照常可点
import { Check } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  Flex,
  IconButton,
  ItemList,
  ItemListItem,
  Small,
  StatusDot,
} from '@zerodep-dev/vue-tsx-pro-ui';

const initial = [
  {
    id: 1,
    title: '新的待办：资料审核',
    from: 'PO-2026-0187 · 办公椅供应商切换',
    time: '09:42',
    read: false,
  },
  { id: 2, title: '被退回：方案设计', from: '验收报告缺少试验报告', time: '08:10', read: false },
  { id: 3, title: '已通过：财务复核', from: 'PO-2026-0233 · 显示器支架', time: '昨天', read: true },
];

export default _component(() => {
  let items = _state(initial.map((item) => ({ ...item })));
  return () => (
    <Card padding="xs">
      <ItemList divided inset="sm">
        {items.map((item) => (
          <ItemListItem
            key={item.id}
            align="start"
            start={
              <StatusDot
                tone={item.read ? 'neutral' : 'accent'}
                label={item.read ? undefined : '未读'}
              />
            }
            title={item.title}
            description={item.from}
            href={`#notice-${item.id}`}
            end={
              <Flex align="center" gap="xs">
                <Small tone="muted">{item.time}</Small>
                {!item.read && (
                  <IconButton
                    icon={Check}
                    size="sm"
                    variant="ghost"
                    aria-label={`把“${item.title}”标为已读`}
                    onClick={() => (item.read = true)}
                  />
                )}
              </Flex>
            }
          />
        ))}
      </ItemList>
    </Card>
  );
});
