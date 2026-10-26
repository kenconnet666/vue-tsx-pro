// 前置图标、个数上限、外观与状态；Field 的 required、readonly、disabled 交给里面的输入框
import { Hash } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Field, Grid, TagsInput } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  let topics = _state<string[]>(['vue', 'tsx']);
  let keywords = _state<string[]>([]);
  return () => (
    <Grid minItemWidth="16rem" gap="lg">
      <Field label="话题" description={`最多 3 个，已有 ${topics.length} 个`}>
        <TagsInput _value={topics} max={3} icon={Hash} clearable placeholder="输入后回车" />
      </Field>
      <Field label="关键词" required error={keywords.length ? undefined : '至少填一个关键词'}>
        <TagsInput _value={keywords} variant="soft" placeholder="逗号或分号分隔" />
      </Field>
      <Field label="只读" readonly>
        <TagsInput _value={['设计', '前端']} />
      </Field>
      <Field label="不可用" disabled>
        <TagsInput _value={['设计', '前端']} size="sm" />
      </Field>
    </Grid>
  );
});
