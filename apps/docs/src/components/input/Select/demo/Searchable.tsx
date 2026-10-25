// 选项多时：searchable 在弹出层顶部放搜索框，输入就过滤；已选的项被过滤掉了，触发框里照样显示
import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, Grid, Select, Small, type ListboxOption } from '@vue-tsx-pro/ui';

// 六十家虚构的供应商，按地区分组
const regions = ['华东', '华北', '华南', '西南', '东北', '海外'];
const kinds = ['复材', '机加', '钣金', '标准件', '密封件', '线束', '液压', '涂装', '铸锻', '电子'];
const suppliers: ListboxOption[] = regions.flatMap((region, r) =>
  kinds.map((kind, k) => ({
    value: `S${r}${k}`,
    label: `${region}${kind}供应商${'甲乙丙丁戊己庚辛壬癸'[k]}`,
    description: `供应商代码 S-${2026_00 + r * 10 + k}`,
    group: region,
  })),
);

export default _component(() => {
  let supplier = _state('S00');
  let partners = _state<string[]>(['S13', 'S51']);
  return () => (
    <Grid minItemWidth="16rem" gap="md">
      <Flex direction="column" gap="xs">
        <Field label="涉及供应商" description="六十个选项：打开后直接输入“密封”试试">
          <Select items={suppliers} _value={supplier} searchable />
        </Field>
        <Small tone="muted">值：{supplier || '—'}</Small>
      </Flex>
      <Field label="第二货源（多选）">
        <Select items={suppliers} selectionMode="multiple" _value={partners} searchable clearable />
      </Field>
    </Grid>
  );
});
