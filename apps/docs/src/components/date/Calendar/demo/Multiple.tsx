// 排班：多选这个月要值班的日子，右侧按日期列出，可以单独移除；并排两个月、显示周数
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Button, Calendar, Card, Flex, Strong, Tag, Text, useFormat } from '@vue-tsx-pro/ui';

const styles = css.create({ side: { flexGrow: 1, flexBasis: '14rem' } });

export default _component(() => {
  const format = useFormat();
  let shifts = _state<string[]>([]);

  return () => {
    const sorted = [...shifts].sort();
    return (
      <Flex gap="xl" wrap align="start">
        <Calendar
          selectionMode="multiple"
          value={_bind(shifts)}
          visibleMonths={2}
          showWeekNumbers
          aria-label="值班日期"
        />
        <Card
          sx={styles.side}
          header={
            <Flex justify="between" align="center">
              <Strong>值班 {sorted.length} 天</Strong>
              <Button
                size="sm"
                variant="ghost"
                tone="neutral"
                disabled={!sorted.length}
                onClick={() => (shifts = [])}
              >
                清空
              </Button>
            </Flex>
          }
        >
          {sorted.length ? (
            <Flex gap="xs" wrap>
              {sorted.map((date) => (
                <Tag key={date} onRemove={() => (shifts = shifts.filter((item) => item !== date))}>
                  {format.date(date, { month: 'numeric', day: 'numeric', weekday: 'short' })}
                </Tag>
              ))}
            </Flex>
          ) : (
            <Text tone="muted">点日历上的日子加入排班，再点一次取消</Text>
          )}
        </Card>
      </Flex>
    );
  };
});
