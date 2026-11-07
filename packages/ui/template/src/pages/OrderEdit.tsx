// 编辑页（新建与修改共用）：SchemaForm 按 api/orders.ts 的 schema 生成表单，校验与提交交给 useForm
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Card,
  emptyValues,
  Flex,
  H1,
  SchemaForm,
  useForm,
  type FormController,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getOrder, orderSchema, saveOrder, type OrderInput } from '../api/orders';

export default _component(() => {
  const route = useRoute();
  const router = useRouter();
  const id = typeof route.params['id'] === 'string' ? route.params['id'] : null;
  const form: FormController<OrderInput> = useForm({
    schema: orderSchema,
    initial: emptyValues(orderSchema),
    onSubmit: async (values) => {
      const saved = await saveOrder(id, values);
      await router.push(`/orders/${saved.id}`);
    },
  });

  // 修改：取到原来的值后作为初始值（dirty 从这里算起）
  onMounted(async () => {
    if (!id) return;
    const order = await getOrder(id);
    if (order) form.reset(order);
  });

  return () => (
    <Flex direction="column" gap="lg">
      <H1 size="xxl">{id ? `修改 ${id}` : '新建采购单'}</H1>
      <Card>
        <SchemaForm controller={form} columns={2} submitText={id ? '保存' : '提交'} />
      </Card>
    </Flex>
  );
});
