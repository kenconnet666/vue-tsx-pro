import { _component } from '@vue-tsx-pro/tsx';
import { Field, Flex, TagsInput } from '@vue-tsx-pro/ui';

const team = [
  { value: 'yihang@example.com', label: '周一航', description: 'yihang@example.com' },
  { value: 'xiaoman@example.com', label: '林小满', description: 'xiaoman@example.com' },
  { value: 'chenmo@example.com', label: '陈默', description: 'chenmo@example.com' },
  { value: 'xuyou@example.com', label: '许悠', description: 'xuyou@example.com' },
];

export default _component(() => {
  let keywords = _state(['组件库', 'Vue', 'TSX']);
  let recipients = _state(['xiaoman@example.com']);
  return () => (
    <Flex direction="column" gap="md">
      <Field label="关键词" description="回车或输入逗号加一个；粘贴时按逗号与换行拆开；最多 6 个">
        <TagsInput _value={keywords} max={6} clearable />
      </Field>
      <Field label="抄送" description="只能从团队成员里选">
        <TagsInput _value={recipients} items={team} allowCustomValue={false} />
      </Field>
    </Flex>
  );
});
