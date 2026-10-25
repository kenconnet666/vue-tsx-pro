// 内部报表：铺上“查看人 + 日期 + 内部资料”，截图外传时能看出是谁、什么时候看的；文字照常能选中、按钮照常能点。
// 打开“整页”后水印盖住整个窗口（position: fixed），离开示例页前记得关掉
import { Download } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Card, Flex, H4, Small, Stat, Switch, Text, Watermark } from '@vue-tsx-pro/ui';

// 本地日期（toISOString 是 UTC，凌晨会差一天）
const today = new Date().toLocaleDateString('sv-SE');

const rows = [
  ['华东仓', '轴承 6205', '1 280 件', '¥ 38 400'],
  ['华南仓', '密封圈 O-32', '9 600 件', '¥ 11 520'],
  ['西南仓', '液压阀 HV-08', '86 件', '¥ 51 600'],
];

export default _component(() => {
  let fullscreen = _state(false);
  return () => (
    <Flex direction="column" gap="md">
      <Switch _checked={fullscreen}>整页水印</Switch>
      <Watermark content={['林小满 · 采购部', today, '内部资料 请勿外传']} fullscreen={fullscreen}>
        <Card>
          <Flex direction="column" gap="md">
            <Flex align="center" justify="between" gap="sm" wrap>
              <H4>10 月库存周转报表</H4>
              <Button size="sm" variant="soft" icon={Download}>
                导出
              </Button>
            </Flex>
            <Flex gap="lg" wrap>
              <Stat
                label="库存总额"
                value={101520}
                format={{ style: 'currency', currency: 'CNY' }}
              />
              <Stat label="周转天数" value={23} unit="天" change={-0.12} invertChange />
              <Stat label="呆滞物料" value={7} unit="项" tone="warning" />
            </Flex>
            <Flex direction="column" gap="xs">
              {rows.map(([warehouse, item, quantity, amount]) => (
                <Flex key={item} gap="md" wrap>
                  <Small tone="muted" style={{ width: '4em' }}>
                    {warehouse}
                  </Small>
                  <Text size="sm" style={{ flex: 1 }}>
                    {item}
                  </Text>
                  <Text size="sm" mono>
                    {quantity}
                  </Text>
                  <Text size="sm" mono style={{ width: '6em', textAlign: 'end' }}>
                    {amount}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Flex>
        </Card>
      </Watermark>
    </Flex>
  );
});
