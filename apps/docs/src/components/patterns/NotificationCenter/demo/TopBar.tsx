// 顶栏的铃铛：未读数、按类型筛选、只看未读、点一条标为已读、全部标为已读；读过的状态由使用方保存
import { Plane, Search } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Avatar, Button, Flex, Icon, Small, Strong, TextField } from '@vue-tsx-pro/ui';
import { NotificationCenter, type NotificationItem } from '@vue-tsx-pro/ui/patterns';

const styles = css.create({
  bar: {
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_lg',
    backgroundColor: '_surface',
  },
  brand: { color: '_accentText' },
  search: { flexGrow: 1, maxWidth: '20em', marginInlineStart: 'auto' },
});

const NOW = Date.parse('2026-10-21T10:00:00+08:00');
const seed = (): NotificationItem[] => [
  {
    id: '1',
    title: '新的待办：资料审核',
    description: 'PO-2026-0187 · 办公椅供应商切换',
    time: '2026-10-21T09:42:00+08:00',
    type: 'todo',
    read: false,
  },
  {
    id: '2',
    title: '被退回：方案设计',
    description: 'PO-2026-0214 · 验收报告缺少试验报告',
    time: '2026-10-21T08:10:00+08:00',
    type: 'returned',
    read: false,
    tone: 'warning',
  },
  {
    id: '3',
    title: '催办：财务复核',
    description: 'PO-2026-0233 · 请今天内验收',
    time: '2026-10-20T16:30:00+08:00',
    type: 'remind',
    read: false,
    tone: 'danger',
  },
  {
    id: '4',
    title: '财务部收件箱有新的待办：费用核算',
    description: 'PO-2026-0179 · 包装纸箱第二供应商',
    time: '2026-10-19T11:00:00+08:00',
    type: 'todo',
    read: true,
  },
  {
    id: '5',
    title: '计划调整已通过：货架紧固件减量',
    description: 'PO-2026-0276 · 计划完成改为 2026-12-15',
    time: '2026-10-18T15:20:00+08:00',
    type: 'todo',
    read: true,
  },
];

export default _component(() => {
  let items = _state(seed());
  let clicked = _state('');
  const read = (ids: string[]) =>
    (items = items.map((item) => (ids.includes(item.id) ? { ...item, read: true } : item)));
  return () => (
    <Flex direction="column" gap="md">
      <Flex align="center" gap="md" sx={styles.bar}>
        <Icon icon={Plane} sx={styles.brand} />
        <Strong>采购管理平台</Strong>
        <TextField icon={Search} size="sm" placeholder="搜索编号、名称" sx={styles.search} />
        <NotificationCenter
          items={items}
          types={[
            { key: 'todo', label: '待办' },
            { key: 'returned', label: '退回' },
            { key: 'remind', label: '催办' },
          ]}
          now={NOW}
          onRead={read}
          onItemClick={(item) => (clicked = item.title)}
          footer={
            <Button size="sm" variant="link" onClick={() => (items = seed())}>
              恢复演示数据
            </Button>
          }
        />
        <Avatar name="林小满" size="sm" />
      </Flex>
      <Small tone="muted">
        {clicked
          ? `点了：${clicked}`
          : `${items.filter((item) => !item.read).length} 条未读，点铃铛打开`}
      </Small>
    </Flex>
  );
});
