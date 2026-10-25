// 左列表、右详情：拖分隔条调比例（双击回到初始比例），右栏可以收起；比例记在浏览器里
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Flex, Small, Splitter, Text, usePersistentState } from '@vue-tsx-pro/ui';

const mails = [
  {
    id: 1,
    from: '财务部',
    title: '费用核算待复核',
    body: '测算参数与报价不一致，请复核材料单价。',
  },
  {
    id: 2,
    from: 'PMO',
    title: '派单：机柜导轨第二供应商',
    body: '请在 5 个工作日内完成方案设计。',
  },
  { id: 3, from: '财务', title: '结算超 30 天提醒', body: '显示器支架的结算已经 32 天。' },
];

const styles = css.create({
  frame: {
    height: '16rem',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    width: '100%',
    textAlign: 'start',
    paddingBlock: '_sm',
    paddingInline: '_md',
    borderWidth: 0,
    backgroundColor: { default: 'transparent', ':hover': '_fillHover' },
    cursor: 'pointer',
    color: 'inherit',
  },
  active: { backgroundColor: '_accentSoft' },
  detail: { padding: '_md' },
});

export default _component(() => {
  const layout = usePersistentState('docs:splitter-demo', { size: 40, hidden: false });
  let current = _state(1);
  return () => {
    const mail = mails.find((item) => item.id === current)!;
    return (
      <Splitter
        sx={styles.frame}
        _size={layout.value.size}
        onUpdate:_size={(size: number) => (layout.value = { ...layout.value, size })}
        collapsible="end"
        _collapsed={layout.value.hidden}
        onUpdate:_collapsed={(hidden: boolean) => (layout.value = { ...layout.value, hidden })}
        start={mails.map((item) => (
          <button
            key={item.id}
            type="button"
            {...css.attrs(styles.item, item.id === current && styles.active)}
            onClick={() => (current = item.id)}
          >
            <Text size="sm" weight="semibold">
              {item.title}
            </Text>
            <Small tone="muted">{item.from}</Small>
          </button>
        ))}
        end={
          <Flex direction="column" gap="sm" sx={styles.detail}>
            <Text weight="semibold">{mail.title}</Text>
            <Small tone="muted">来自 {mail.from}</Small>
            <Text size="sm">{mail.body}</Text>
          </Flex>
        }
      />
    );
  };
});
