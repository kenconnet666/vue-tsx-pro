import { RefreshCw } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { AnimatedNumber, Button, Descriptions, Flex } from '@vue-tsx-pro/ui';
import Decimal from 'decimal.js';

const random = (min: number, max: number) => min + Math.random() * (max - min);

export default _component(() => {
  let balance = _state(new Decimal('12880.35'));
  let growth = _state(0.124);
  let downloads = _state(9_007_199_254_740_993n);
  let rating = _state(4.6);

  const shuffle = () => {
    balance = balance.plus(new Decimal(random(-2000, 2000).toFixed(2)));
    growth = random(-0.2, 0.3);
    downloads += BigInt(Math.round(random(1000, 50_000)));
    rating = Math.round(random(3, 5) * 10) / 10;
  };

  return () => (
    <Flex direction="column" gap="md" align="start">
      <Descriptions
        columns={2}
        items={[
          {
            label: '余额（Decimal）',
            value: (
              <AnimatedNumber value={balance} format={{ style: 'currency', currency: 'CNY' }} />
            ),
          },
          {
            label: '环比',
            value: (
              <AnimatedNumber
                value={growth}
                format={{ style: 'percent', maximumFractionDigits: 1 }}
                trend
              />
            ),
          },
          { label: '累计下载（bigint）', value: <AnimatedNumber value={downloads} /> },
          {
            label: '评分',
            value: (
              <AnimatedNumber
                value={rating}
                format={{ minimumFractionDigits: 1 }}
                suffix=" / 5"
                duration="xl"
              />
            ),
          },
        ]}
      />
      <Button size="sm" variant="soft" icon={RefreshCw} onClick={shuffle}>
        换一组数
      </Button>
    </Flex>
  );
});
