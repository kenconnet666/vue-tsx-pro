// 前置图标、外观与状态：与 TextField、日期输入框同一套
import { Globe, MapPin } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Grid, Select, type ListboxOption } from '@vue-tsx-pro/ui';

const languages: ListboxOption[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' },
];
const cities = ['北京', '上海', '广州', '深圳', '杭州'];

export default _component(() => {
  let language = _state('zh-CN');
  let city = _state<string | null>(null);
  return () => (
    <Grid minItemWidth="14rem" gap="lg">
      <Field label="界面语言">
        <Select items={languages} _value={language} icon={Globe} />
      </Field>
      <Field label='variant="soft" radius="full"'>
        <Select
          items={cities}
          _value={city}
          icon={MapPin}
          variant="soft"
          radius="full"
          clearable
          placeholder="选择城市"
        />
      </Field>
      <Field label="必填" required error={city ? undefined : '请选择城市'}>
        <Select items={cities} _value={city} placeholder="选择城市" />
      </Field>
      <Field label='size="sm"'>
        <Select items={languages} _value={language} size="sm" />
      </Field>
      <Field label="只读" readonly description="能聚焦、能看，不能打开">
        <Select items={languages} _value="en-US" icon={Globe} />
      </Field>
      <Field label="不可用" disabled>
        <Select items={languages} _value="ja-JP" />
      </Field>
    </Grid>
  );
});
