import { RotateCcw } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Card, Flex, Strong, Tag, Text, type StatusTone } from '@vue-tsx-pro/ui';

const initial: [string, StatusTone][] = [
  ['价格：100–500 元', 'accent'],
  ['品牌：小米', 'neutral'],
  ['品牌：华为', 'neutral'],
  ['有货', 'success'],
  ['包邮', 'info'],
  ['评分 4.5 以上', 'warning'],
];

export default _component(() => {
  let filters = _state([...initial]);
  return () => (
    <Card>
      <Flex direction="column" gap="md">
        <Flex align="center" justify="between" gap="sm">
          <Strong>已选筛选条件（{filters.length}）</Strong>
          <Button
            size="sm"
            variant="ghost"
            icon={RotateCcw}
            disabled={filters.length === initial.length}
            onClick={() => (filters = [...initial])}
          >
            恢复
          </Button>
        </Flex>
        <Flex gap="sm" wrap>
          {filters.map(([label, tone]) => (
            <Tag
              key={label}
              tone={tone}
              radius="full"
              onRemove={() => (filters = filters.filter(([item]) => item !== label))}
            >
              {label}
            </Tag>
          ))}
          {filters.length === 0 && (
            <Text size="sm" tone="muted">
              没有筛选条件，显示全部商品
            </Text>
          )}
        </Flex>
      </Flex>
    </Card>
  );
});
