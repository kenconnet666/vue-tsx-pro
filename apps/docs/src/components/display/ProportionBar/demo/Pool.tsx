// 工单的三种状态：互斥、加起来是总数；图例后面可以补一句（“待定价”）
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, ProportionBar, Small } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    <ProportionBar
      aria-label="工单构成"
      segments={[
        { key: 'confirmed', label: '已确认收益', value: 25, tone: 'success' },
        { key: 'unpriced', label: '待排期', value: 4, tone: 'warning' },
        { key: 'plan', label: '方案待定', value: 35, tone: 'info' },
      ]}
      valueText={(segment) => `${segment.value} 项`}
      legendExtra={(segment) => segment.key === 'unpriced' && <Small tone="muted">待定价</Small>}
    />
    <ProportionBar
      aria-label="存储空间"
      size="sm"
      segments={[
        { key: 'docs', label: '文档', value: 42, color: '#3e63dd' },
        { key: 'images', label: '图片', value: 28, color: '#12a594' },
        { key: 'free', label: '剩余', value: 30, tone: 'neutral' },
      ]}
      valueText={(segment) => `${segment.value} GB`}
    />
  </Flex>
));
