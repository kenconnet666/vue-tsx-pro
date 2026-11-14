// 任意数据做建议（toOption）：选一项填进来的是它的文字，说明照常显示在下面一行；外观与状态同其他输入框
import { MapPin } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Autocomplete, Field, Flex, Grid } from '@zerodep-dev/vue-tsx-pro-ui';

interface Address {
  id: string;
  text: string;
  note: string;
}

const addresses: Address[] = [
  { id: 'hz', text: '杭州市余杭区文一西路 969 号', note: '总部 · 工作日 9:00–18:00 收货' },
  { id: 'nb', text: '宁波市北仑区明州西路 88 号', note: '一号仓 · 全天收货' },
  { id: 'sz', text: '苏州市工业园区星湖街 328 号', note: '研发中心 · 前台代收' },
];
const cities = ['杭州', '宁波', '苏州', '无锡', '成都'];

export default _component(() => {
  let address = _state('');
  let city = _state('');
  return () => (
    <Flex direction="column" gap="lg">
      <Field
        label="收货地址"
        description="常用地址作建议：输入“杭州”“路”试试，也可以自己写一个新的"
      >
        <Autocomplete
          _value={address}
          items={addresses}
          toOption={(item) => ({ value: item.id, label: item.text, description: item.note })}
          icon={MapPin}
          clearable
          placeholder="省市区、街道、门牌号"
        />
      </Field>
      <Grid minItemWidth="11rem" gap="md">
        <Field label='variant="soft" radius="full"'>
          <Autocomplete
            _value={city}
            items={cities}
            variant="soft"
            radius="full"
            placeholder="城市"
          />
        </Field>
        <Field label='size="sm"'>
          <Autocomplete _value={city} items={cities} size="sm" placeholder="城市" />
        </Field>
        <Field label="必填" required error={city ? undefined : '请填写城市'}>
          <Autocomplete _value={city} items={cities} placeholder="城市" />
        </Field>
        <Field label="只读">
          <Autocomplete _value="杭州" items={cities} readonly />
        </Field>
        <Field label="不可用">
          <Autocomplete _value="杭州" items={cities} disabled />
        </Field>
      </Grid>
    </Flex>
  );
});
