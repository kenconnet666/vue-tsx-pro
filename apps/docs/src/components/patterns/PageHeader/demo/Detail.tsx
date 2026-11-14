// 详情页的页头：面包屑、返回、标题后面的状态、说明、结束边的操作，下面接摘要
import { Pencil, Truck } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Badge, Button, Descriptions, Text } from '@zerodep-dev/vue-tsx-pro-ui';
import { PageHeader } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

export default _component(() => {
  let backs = _state(0);
  return () => (
    <PageHeader
      breadcrumbs={[
        { label: '采购', href: '#purchase' },
        { label: '采购单', href: '#orders' },
        { label: 'PO-2026-0187' },
      ]}
      title="PO-2026-0187"
      meta={<Badge tone="success">已到货</Badge>}
      description="华辰精密 · 2026-10-20 下单 · 含税 86,400.00 元"
      onBack={() => (backs += 1)}
      actions={
        <>
          <Button variant="outline" tone="neutral" icon={Pencil}>
            编辑
          </Button>
          <Button icon={Truck}>催单</Button>
        </>
      }
    >
      <Descriptions
        columns={3}
        items={[
          { label: '采购员', value: '林小满' },
          { label: '交货日期', value: '2026-11-05' },
          { label: '付款方式', value: '月结 30 天' },
        ]}
      />
      <Text tone="muted" size="sm">
        点了 {backs} 次返回
      </Text>
    </PageHeader>
  );
});
