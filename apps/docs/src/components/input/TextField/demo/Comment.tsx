import { _component } from '@vue-tsx-pro/tsx';
import { Avatar, Button, Card, Field, Flex, Textarea } from '@vue-tsx-pro/ui';

export default _component(() => {
  let comment = _state('');
  let notes = _state('第一行\n第二行\n第三行');
  return () => (
    <Flex direction="column" gap="md">
      <Card>
        <Flex gap="md" align="start">
          <Avatar size="sm" name="林小满" />
          <Flex direction="column" gap="sm" grow>
            <Field label="发表评论" description="随内容自动增高，最多 6 行后出现滚动条">
              <Textarea
                value={_bind(comment)}
                rows={2}
                maxRows={6}
                maxlength={200}
                showCount
                placeholder="说点什么…"
              />
            </Field>
            <Flex justify="end">
              <Button size="sm" disabled={!comment.trim()}>
                发布
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Card>
      <Field
        label="固定高度（fixed）"
        description="不自动增高，右下角可以拖动调整；clearable 在右上角放清空按钮"
      >
        <Textarea value={_bind(notes)} rows={3} fixed clearable />
      </Field>
    </Flex>
  );
});
