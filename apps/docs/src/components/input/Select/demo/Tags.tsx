// 多选的标签：抄送人多时按宽度收起（拖窄窗口看“+N”变化）；车型只显示前两个；工单标签可以现场新建
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Field, Flex, Select, Small } from '@zerodep-dev/vue-tsx-pro-ui';

const people = ['周一航', '许悠', '林小满', '赵浩然', '陈默', '韩笑', '宋知遥', '顾北辰', '沈清禾'];
const models = ['X3 标准版', 'X3 长续航', 'X5 四驱', 'X5 越野', 'M7 商务', 'M7 豪华'];

export default _component(() => {
  let cc = _state(['许悠', '林小满', '赵浩然', '陈默', '韩笑', '宋知遥', '顾北辰', '沈清禾']);
  let fits = _state(['X3 标准版', 'X3 长续航', 'X5 四驱']);
  let labels = _state(['紧急', '前端', '后端', '设计', '性能']);
  let picked = _state(['紧急']);
  return () => (
    <Flex direction="column" gap="md">
      <Field label="抄送" description="一行放不下的收进“+N”">
        <Select
          items={people}
          selectionMode="multiple"
          _value={cc}
          maxTagCount="responsive"
          searchable
          clearable
        />
      </Field>
      <Field label="适用车型" description="只显示前两个">
        <Select items={models} selectionMode="multiple" _value={fits} maxTagCount={2} />
      </Field>
      <Field label="工单标签" description="输入没有的标签，选“新建”加进选项">
        <Select
          items={labels}
          selectionMode="multiple"
          _value={picked}
          creatable
          onCreate={(text) => (labels = [...labels, text])}
          placeholder="选择或新建标签"
        />
      </Field>
      <Small tone="muted">
        抄送 {cc.length} 人 · 车型 {fits.length} 个 · 标签：{picked.join('、') || '无'}
      </Small>
    </Flex>
  );
});
