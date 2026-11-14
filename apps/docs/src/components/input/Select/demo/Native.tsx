// 原生下拉框：外壳、尺寸、出错同别的输入框，弹出的列表是系统的（手机上是滚轮或底部列表）
import { MapPin } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Field, Flex, NativeSelect, Small } from '@zerodep-dev/vue-tsx-pro-ui';

const cities = [
  { value: 'sh', label: '上海', group: '华东' },
  { value: 'hz', label: '杭州', group: '华东' },
  { value: 'nj', label: '南京', group: '华东' },
  { value: 'gz', label: '广州', group: '华南' },
  { value: 'sz', label: '深圳', group: '华南' },
  { value: 'hk', label: '香港（暂不配送）', group: '华南', disabled: true },
];

export default _component(() => {
  let city = _state<string | null>(null);
  return () => (
    <Flex direction="column" gap="md">
      <Field label="收货城市" required>
        <NativeSelect _value={city} items={cities} placeholder="选择城市" icon={MapPin} />
      </Field>
      <Flex gap="md" wrap>
        <NativeSelect items={['紧凑', '标准', '宽松']} _value="标准" size="sm" aria-label="行高" />
        <NativeSelect items={['只读的值']} _value="只读的值" readonly aria-label="只读" />
        <NativeSelect items={['不可用']} _value="不可用" disabled aria-label="不可用" />
      </Flex>
      <Small tone="muted">选中的值：{city ?? '（还没选）'}</Small>
    </Flex>
  );
});
