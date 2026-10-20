import { Check, Minus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  Badge,
  Icon,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  VisuallyHidden,
} from '@vue-tsx-pro/ui';

const plans = ['免费版', '团队版', '企业版'] as const;
const features: [string, (boolean | string)[]][] = [
  ['成员数', ['3', '50', '不限']],
  ['存储空间', ['5 GB', '200 GB', '2 TB']],
  ['单点登录（SSO）', [false, false, true]],
  ['操作审计', [false, true, true]],
  ['专属客服', [false, false, true]],
  ['价格（每月）', ['¥0', '¥299', '¥1,999']],
];

// 勾与叉是图标：旁边放一份给读屏的文字
const mark = (value: boolean | string) =>
  typeof value === 'string' ? (
    value
  ) : (
    <>
      <Icon icon={value ? Check : Minus} aria-hidden />
      <VisuallyHidden>{value ? '包含' : '不包含'}</VisuallyHidden>
    </>
  );

export default _component(() => () => (
  <Table aria-label="套餐对比">
    <TableCaption>三档套餐的功能对比，价格按年付折算</TableCaption>
    <TableHead>
      <TableRow>
        <TableHeaderCell>功能</TableHeaderCell>
        {plans.map((plan) => (
          <TableHeaderCell key={plan} align="center">
            {plan}
            {plan === '团队版' && (
              <>
                {' '}
                <Badge tone="accent" radius="full">
                  推荐
                </Badge>
              </>
            )}
          </TableHeaderCell>
        ))}
      </TableRow>
    </TableHead>
    <TableBody>
      {features.map(([feature, values]) => (
        <TableRow key={feature}>
          <TableHeaderCell scope="row">{feature}</TableHeaderCell>
          {values.map((value, index) => (
            <TableCell key={plans[index]} align="center">
              {mark(value)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  </Table>
));
