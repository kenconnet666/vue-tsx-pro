// 详情页：面包屑、标题行（单号与操作）、Descriptions 列出字段；加载中显示骨架，找不到时是 Empty
import { Pencil } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Breadcrumbs,
  Card,
  Descriptions,
  Empty,
  Flex,
  H1,
  LinkButton,
  SkeletonText,
  useRequest,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { useRoute } from 'vue-router';
import { getOrder } from '../api/orders';

export default _component(() => {
  const route = useRoute();
  const order = useRequest(() => getOrder(String(route.params['id'])));
  return () => {
    const data = order.data;
    return (
      <Flex direction="column" gap="lg">
        <Breadcrumbs
          items={[{ label: '采购单', href: '/orders' }, { label: String(route.params['id']) }]}
        />
        {order.loading && !data ? (
          <SkeletonText lines={4} />
        ) : !data ? (
          <Empty title="没有这张采购单" />
        ) : (
          <>
            <Flex align="center" gap="md" wrap>
              <H1 size="xxl">{data.id}</H1>
              <LinkButton href={`/orders/${data.id}/edit`} icon={Pencil} variant="soft">
                修改
              </LinkButton>
            </Flex>
            <Card>
              <Descriptions
                columns="auto"
                items={[
                  { label: '供应商', value: data.supplier },
                  { label: '品类', value: data.category },
                  { label: '金额', value: `¥ ${data.amount.toLocaleString('zh-CN')}` },
                  { label: '交货日期', value: data.delivery },
                  { label: '备注', value: data.note || '—', span: 2 },
                ]}
              />
            </Card>
          </>
        )}
      </Flex>
    );
  };
});
