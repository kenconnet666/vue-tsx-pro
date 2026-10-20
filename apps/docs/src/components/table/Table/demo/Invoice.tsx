import { _component } from '@vue-tsx-pro/tsx';
import {
  Flex,
  Small,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
  ToggleGroup,
  ToggleItem,
} from '@vue-tsx-pro/ui';

const lines = [
  ['UI 设计（首页、列表、详情）', 3, 1200],
  ['组件开发（人天）', 8, 1500.5],
  ['无障碍检查与修复', 2, 980],
  ['部署与上线支持', 1, 600],
] as const;

const money = (value: number) =>
  value.toLocaleString('zh-CN', { style: 'currency', currency: 'CNY' });

export default _component(() => {
  let density = _state<'compact' | 'standard' | 'comfortable'>('standard');
  let striped = _state(true);
  return () => {
    const total = lines.reduce((sum, [, quantity, price]) => sum + quantity * price, 0);
    return (
      <Flex direction="column" gap="md">
        <Flex align="center" gap="md" wrap>
          <ToggleGroup value={_bind(density)} required size="sm" aria-label="密度">
            <ToggleItem value="compact">紧凑</ToggleItem>
            <ToggleItem value="standard">标准</ToggleItem>
            <ToggleItem value="comfortable">宽松</ToggleItem>
          </ToggleGroup>
          <Switch checked={_bind(striped)} size="sm">
            斑马纹
          </Switch>
        </Flex>
        <Table density={density} striped={striped} aria-label="报价明细">
          <TableHead>
            <TableRow>
              <TableHeaderCell>项目</TableHeaderCell>
              <TableHeaderCell align="end">数量</TableHeaderCell>
              <TableHeaderCell align="end">单价</TableHeaderCell>
              <TableHeaderCell align="end">小计</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map(([item, quantity, price]) => (
              <TableRow key={item}>
                <TableCell>{item}</TableCell>
                <TableCell align="end">{quantity}</TableCell>
                <TableCell align="end" nowrap>
                  {money(price)}
                </TableCell>
                <TableCell align="end" nowrap>
                  {money(quantity * price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFoot>
            <TableRow>
              <TableHeaderCell scope="row" colspan={3}>
                合计
              </TableHeaderCell>
              <TableCell align="end" nowrap>
                {money(total)}
              </TableCell>
            </TableRow>
          </TableFoot>
        </Table>
        <Small tone="muted">数字右对齐、不换行；表格比容器宽时在外层横向滚动，不撑宽页面</Small>
      </Flex>
    );
  };
});
