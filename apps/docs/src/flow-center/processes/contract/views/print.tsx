// 打印页（views/print.tsx）：审批单上点“打印”时预览、打印。只用单据的值与这张单的概况
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { FlowViewProps, FormValues } from '@zerodep-dev/flow-ts-model';
import { Descriptions, Flex, H2, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import form from '../form';
import Plans from './plans';

export const title = '合同审批单';

export default _component(({ variables, instance }: FlowViewProps<FormValues<typeof form>>) => {
  return () => (
    <Flex direction="column" gap="md">
      <H2>合同审批单：{variables.title ?? ''}</H2>
      <Descriptions
        columns={2}
        items={[
          { label: '相对方', value: variables.counterparty ?? '—' },
          { label: '合同金额', value: variables.amount ?? '—' },
          { label: '签订日期', value: variables.signOn ?? '—' },
          { label: '单号', value: instance ? `#${instance.id}` : '—' },
        ]}
      />
      <Plans variables={variables} instance={instance} />
      <Small tone="muted">部门负责人：＿＿＿＿　　法务：＿＿＿＿　　财务：＿＿＿＿</Small>
    </Flex>
  );
});
