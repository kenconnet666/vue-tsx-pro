// 酒店的价格日历：日期格里加上当天的房价，最低价用成功色标出；周五、周六更贵，售罄的日子不可选
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Calendar,
  Flex,
  isoDayOfWeek,
  shiftIsoDate,
  Text,
  todayIso,
  useFormat,
} from '@vue-tsx-pro/ui';

const styles = css.create({
  // 格子放得下价格：比默认的 2.25em 宽、高一些
  cell: { width: '3.25em', height: '3.25em' },
  day: { lineHeight: '_tight' },
  price: { fontSize: '0.7em', color: '_textMuted' },
  lowest: { color: '_successText', fontWeight: '_semibold' },
  // 选中的格子是品牌色实底：价格跟着用实底上的文字色
  onSelected: { color: 'inherit' },
});

export default _component(() => {
  const format = useFormat();
  const today = todayIso();
  const soldOut = new Set([5, 6].map((days) => shiftIsoDate(today, { days })));
  const priceOf = (date: string) => {
    const day = isoDayOfWeek(date);
    const base = day === 5 || day === 6 ? 699 : 459;
    // 按日期给一点起伏，演示数据确定不变
    return base + (Number(date.slice(8)) % 4) * 20;
  };
  let night = _state<string | null>(null);

  return () => {
    const prices = Array.from({ length: 35 }, (_, days) => priceOf(shiftIsoDate(today, { days })));
    const lowest = Math.min(...prices);
    return (
      <Flex direction="column" gap="md">
        <Calendar
          _value={night}
          propsCellButton={{ sx: styles.cell }}
          min={today}
          max={shiftIsoDate(today, { days: 34 })}
          isDateUnavailable={(date) => soldOut.has(date)}
          aria-label="入住日期"
        >
          {(date, cell) => {
            const price = priceOf(date);
            const off = cell.disabled || cell.outside;
            return (
              <Flex direction="column" align="center" sx={styles.day}>
                {/* 读屏已经念了完整日期，数字不重复念；价格照常念 */}
                <span aria-hidden="true">{Number(date.slice(8))}</span>
                {!off && (
                  <span
                    {...css.attrs(
                      styles.price,
                      price === lowest && styles.lowest,
                      cell.selected && styles.onSelected,
                    )}
                  >
                    {cell.unavailable ? '满' : `¥${price}`}
                  </span>
                )}
              </Flex>
            );
          }}
        </Calendar>
        <Text tone="muted">
          {night
            ? `${format.date(night, { month: 'long', day: 'numeric', weekday: 'short' })} 入住，一晚 ¥${priceOf(night)}`
            : `最低 ¥${lowest} 起，周五、周六更贵`}
        </Text>
      </Flex>
    );
  };
});
