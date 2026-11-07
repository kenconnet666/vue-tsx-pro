// 可选中的行：主从视图左边的列表，点一条在右边看详情；正在看的一条是选中色，按钮带 aria-current
import { FolderKanban, Inbox, Send, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Badge,
  Card,
  Flex,
  Icon,
  ItemList,
  ItemListItem,
  Small,
  Text,
} from '@zerodep-dev/vue-tsx-pro-ui';

const folders = [
  { id: 'inbox', name: '收件箱', icon: Inbox, count: 12, note: '12 封未读' },
  { id: 'projects', name: '项目', icon: FolderKanban, count: 3, note: '3 个进行中' },
  { id: 'sent', name: '已发送', icon: Send, count: 0, note: '最近一封在 10:42' },
  { id: 'trash', name: '回收站', icon: Trash2, count: 0, note: '30 天后自动清空', disabled: true },
];

const styles = css.create({
  list: { flexBasis: '14rem', flexGrow: 1 },
  detail: { flexBasis: '16rem', flexGrow: 2 },
});

export default _component(() => {
  let current = _state('inbox');
  return () => {
    const folder = folders.find((item) => item.id === current)!;
    return (
      <Flex gap="md" wrap>
        <Card padding="xs" sx={styles.list}>
          <ItemList aria-label="文件夹" inset="sm">
            {folders.map((item) => (
              <ItemListItem
                key={item.id}
                start={<Icon icon={item.icon} tone="muted" />}
                title={item.name}
                end={item.count > 0 && <Badge radius="full">{item.count}</Badge>}
                selected={item.id === current}
                disabled={item.disabled}
                onSelect={() => (current = item.id)}
              />
            ))}
          </ItemList>
        </Card>
        <Card sx={styles.detail}>
          <Flex direction="column" gap="xs">
            <Text weight="semibold">{folder.name}</Text>
            <Small tone="muted">{folder.note}</Small>
          </Flex>
        </Card>
      </Flex>
    );
  };
});
