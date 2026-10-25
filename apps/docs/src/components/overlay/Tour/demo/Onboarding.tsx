import { Download, Filter, PackageCheck, Plus, Search, Sparkles } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Badge,
  Button,
  Card,
  Flex,
  Icon,
  IconButton,
  Small,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TextField,
  Tour,
  dataAttrs,
  type TourStep,
  t,
} from '@vue-tsx-pro/ui';

const orders = [
  ['#10234', '林小满', '¥1,280.00', 'success', '已发货'],
  ['#10233', '周一航', '¥329.00', 'warning', '待付款'],
  ['#10232', '陈默', '¥4,299.00', 'info', '备货中'],
] as const;

const styles = css.create({
  search: { flexGrow: 1 },
  // 第一步的封面：主题色的渐变上放一个大图标，换主题时跟着变
  cover: {
    display: 'grid',
    placeItems: 'center',
    height: '7rem',
    backgroundImage: `linear-gradient(135deg, ${t.colors.accentSoft}, ${t.colors.fill})`,
    color: '_accentText',
    fontSize: '3rem',
  },
});

export default _component(() => {
  let root = _state.raw<HTMLElement | null>(null);
  let touring = _state(false);
  let step = _state(0);
  let finished = _state(false);
  // 目标限定在示例里找：页面上可能有同名的元素
  const target = (name: string) => () =>
    root?.querySelector<HTMLElement>(`[data-tour="${name}"]`) ?? null;
  const steps: TourStep[] = [
    {
      title: '欢迎使用订单中心',
      content: '花一分钟认识这几个常用功能。',
      cover: (
        <div {...css.attrs(styles.cover)}>
          <Icon icon={PackageCheck} />
        </div>
      ),
    },
    { target: target('search'), title: '搜索', content: '按订单号、客户姓名或手机号查找订单。' },
    { target: target('filter'), title: '筛选', content: '按状态、日期、金额筛选，条件会记住。' },
    {
      target: target('export'),
      title: '导出',
      content: '把当前筛选结果导出为 Excel。',
      placement: 'left',
    },
    {
      target: target('table'),
      title: '订单列表',
      content: '点订单号查看详情，右键有更多操作。',
      placement: 'top',
    },
  ];

  return () => (
    <div ref={_toRef(root)}>
      <Flex direction="column" gap="md">
        <Flex align="center" gap="sm">
          <Button
            icon={Sparkles}
            onClick={() => {
              step = 0;
              touring = true;
            }}
          >
            开始引导
          </Button>
          <Small tone="muted">
            {finished ? '已完成引导' : '← → 切换步骤，Esc 或“跳过”随时退出'}
          </Small>
        </Flex>
        <Card padding="sm">
          <Flex direction="column" gap="sm">
            <Flex align="center" gap="sm">
              <TextField
                type="search"
                icon={Search}
                placeholder="订单号、客户"
                aria-label="搜索订单"
                sx={styles.search}
                {...dataAttrs({ 'data-tour': 'search' })}
              />
              <IconButton
                icon={Filter}
                aria-label="筛选"
                {...dataAttrs({ 'data-tour': 'filter' })}
              />
              <IconButton
                icon={Download}
                aria-label="导出"
                {...dataAttrs({ 'data-tour': 'export' })}
              />
              <Button icon={Plus}>新建</Button>
            </Flex>
            <Table aria-label="订单" {...dataAttrs({ 'data-tour': 'table' })}>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>订单号</TableHeaderCell>
                  <TableHeaderCell>客户</TableHeaderCell>
                  <TableHeaderCell>金额</TableHeaderCell>
                  <TableHeaderCell>状态</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map(([id, customer, amount, tone, status]) => (
                  <TableRow key={id}>
                    <TableCell>{id}</TableCell>
                    <TableCell>{customer}</TableCell>
                    <TableCell>{amount}</TableCell>
                    <TableCell>
                      <Badge tone={tone}>{status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Flex>
        </Card>
        <Tour
          _open={_bind(touring)}
          _current={_bind(step)}
          steps={steps}
          onFinish={() => (finished = true)}
        />
      </Flex>
    </div>
  );
});
