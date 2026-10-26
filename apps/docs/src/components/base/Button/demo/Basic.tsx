import { Eye, Send, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Button, Card, Flex, Paragraph, Strong, Text } from '@zerodep-dev/vue-tsx-pro-ui';

// 页脚默认靠右排；删除放到另一侧，离主要操作远一点
const styles = css.create({ footer: { justifyContent: 'space-between', flexWrap: 'wrap' } });

export default _component(() => {
  let published = _state(false);

  return () => (
    <Card
      header={
        <Flex justify="between" align="center" gap="sm" wrap>
          <Strong>Vue 3.5 的响应式解构</Strong>
          <Text size="sm" tone="muted">
            {published ? '已发布' : '草稿 · 3 分钟前保存'}
          </Text>
        </Flex>
      }
      propsFooter={{ sx: styles.footer }}
      footer={
        <>
          <Button variant="ghost" tone="danger" icon={Trash2}>
            删除
          </Button>
          <Flex gap="sm" wrap>
            <Button variant="soft" tone="neutral">
              取消
            </Button>
            <Button variant="outline" icon={Eye}>
              预览
            </Button>
            <Button icon={Send} onClick={() => (published = !published)}>
              {published ? '撤回' : '发布'}
            </Button>
          </Flex>
        </>
      }
    >
      <Paragraph tone="muted">
        一组操作里只有“发布”用实底；“预览”“取消”依次减弱，“删除”放在另一侧，离主要操作远一点。
      </Paragraph>
    </Card>
  );
});
