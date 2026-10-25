import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Flex, Listbox, Small } from '@vue-tsx-pro/ui';

// 一千个可选的列：Listbox 始终虚拟滚动
const fields = Array.from({ length: 1000 }, (_, index) => ({
  value: `field-${index}`,
  label:
    index < 6
      ? ['订单号', '客户', '金额', '状态', '下单时间', '收货地址'][index]!
      : `自定义字段 ${index - 5}`,
  group: index < 6 ? '常用' : '自定义',
}));

const styles = css.create({ list: { height: '16rem' } });

export default _component(() => {
  let visible = _state(['field-0', 'field-1', 'field-2', 'field-3']);
  return () => (
    <Card padding="sm">
      <Flex direction="column" gap="sm">
        <Listbox
          items={fields}
          selectionMode="multiple"
          _value={visible}
          aria-label="显示的列"
          sx={styles.list}
        />
        <Small tone="muted">
          显示 {visible.length} 列 / 共 {fields.length} 个字段
        </Small>
      </Flex>
    </Card>
  );
});
