// 命令式对话框：不在页面里放 Dialog、不管 open，点哪张发票就弹出哪张的详情；正文拿到句柄，
// “标记已核对”改标题后关上。右边记下每次 onOpenChange 的原因（关闭按钮、Esc、点遮罩、确认、代码调用）
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import {
  Badge,
  Button,
  Card,
  Descriptions,
  Flex,
  ItemList,
  ItemListItem,
  Small,
  useDialog,
  type OpenChangeDetails,
} from '@vue-tsx-pro/ui';

interface Invoice {
  no: string;
  vendor: string;
  amount: string;
  date: string;
}

const invoices: Invoice[] = [
  { no: 'FP-20261021-031', vendor: '华辰精密生产', amount: '¥48,210.00', date: '2026-10-21' },
  { no: 'FP-20261019-118', vendor: '启航研发', amount: '¥12,860.00', date: '2026-10-19' },
  { no: 'FP-20261015-007', vendor: '远山钣金', amount: '¥3,420.50', date: '2026-10-15' },
];

const styles = css.create({
  list: { flex: '1 1 18rem' },
  log: { flex: '0 1 10rem' },
});

const reasonText: Record<OpenChangeDetails['reason'], string> = {
  trigger: '触发器',
  outside: '点遮罩',
  escape: 'Esc',
  close: '关闭按钮',
  confirm: '确认',
  select: '选中',
  hover: '悬停',
  focus: '焦点',
  imperative: '代码调用',
};

export default _component(() => {
  const dialog = useDialog();
  let checked = _state<string[]>([]);
  let log = _state<string[]>([]);

  function show(invoice: Invoice) {
    dialog.open({
      title: `发票 ${invoice.no}`,
      description: invoice.vendor,
      size: 'sm',
      confirmText: '去付款',
      onConfirm: () => new Promise((resolve) => setTimeout(resolve, 600)),
      onOpenChange: (open, { reason }) =>
        (log = [`${open ? '打开' : '关上'} · ${reasonText[reason]}`, ...log].slice(0, 6)),
      content: (handle) => (
        <Flex direction="column" gap="md">
          <Descriptions
            items={[
              { label: '供应商', value: invoice.vendor },
              { label: '金额', value: invoice.amount },
              { label: '开票日期', value: invoice.date },
            ]}
          />
          <Flex gap="sm">
            <Button
              size="sm"
              variant="soft"
              onClick={() => {
                checked = [...checked, invoice.no];
                handle.update({ title: `发票 ${invoice.no}（已核对）` });
                setTimeout(handle.close, 800);
              }}
            >
              标记已核对并关上
            </Button>
          </Flex>
        </Flex>
      ),
    });
  }

  return () => (
    <Flex gap="lg" align="start" wrap>
      <Card padding="none" sx={styles.list}>
        <ItemList divided inset="md">
          {invoices.map((invoice) => (
            <ItemListItem
              key={invoice.no}
              title={invoice.vendor}
              description={`${invoice.no} · ${invoice.amount}`}
              end={
                <Flex align="center" gap="sm">
                  {checked.includes(invoice.no) && <Badge tone="success">已核对</Badge>}
                  <Button size="sm" variant="ghost" onClick={() => show(invoice)}>
                    查看
                  </Button>
                </Flex>
              }
            />
          ))}
        </ItemList>
      </Card>
      <Flex direction="column" gap="xs" sx={styles.log}>
        <Small tone="muted">onOpenChange</Small>
        {log.length === 0 && <Small tone="muted">（还没有）</Small>}
        {log.map((line, index) => (
          <Small key={`${index}-${line}`}>{line}</Small>
        ))}
      </Flex>
    </Flex>
  );
});
