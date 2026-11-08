// 审批单的分区（views/ 的约定见 packages/flow/docs/decisions/0002）：付款计划逐期列出，合计与合同金额对不上时标出来
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { FlowViewProps, FormValues } from '@zerodep-dev/flow-ts-model';
import {
  Alert,
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@zerodep-dev/vue-tsx-pro-ui';
import form from '../form';

export const title = '付款计划';

/** 两位小数的文字换成分，加起来不受浮点误差影响 */
const cents = (value: string | undefined) => Math.round(Number(value ?? 0) * 100);
const money = (value: number) =>
  (value / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2 });

export default _component(({ variables }: FlowViewProps<FormValues<typeof form>>) => {
  return () => {
    const plans = variables.plans ?? [];
    const total = plans.reduce((sum, plan) => sum + cents(plan.amount), 0);
    const expected = cents(variables.amount);
    return (
      <>
        <Table aria-label="付款计划">
          <TableHead>
            <TableRow>
              <TableHeaderCell>期次</TableHeaderCell>
              <TableHeaderCell>付款日</TableHeaderCell>
              <TableHeaderCell align="end">金额</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map((plan, index) => (
              <TableRow key={index}>
                <TableCell>{plan.label}</TableCell>
                <TableCell>{plan.due ?? '—'}</TableCell>
                <TableCell align="end">{money(cents(plan.amount))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFoot>
            <TableRow>
              <TableCell>合计</TableCell>
              <TableCell />
              <TableCell align="end">{money(total)}</TableCell>
            </TableRow>
          </TableFoot>
        </Table>
        {total !== expected && (
          <Alert
            tone="warning"
            title={`合计 ${money(total)}，合同金额 ${money(expected)}`}
            description="财务审核通过前要对上（logic.plansMatch）。"
          />
        )}
      </>
    );
  };
});
