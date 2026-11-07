// 只有图标的按钮：编辑器工具栏（默认 ghost、中性色，一组之间用分隔线隔开），以及各种样式与色调
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heart,
  Italic,
  Link2,
  MoreHorizontal,
  Pencil,
  Settings,
  Share2,
  Trash2,
  Underline,
} from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, Flex, IconButton, Separator } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Card padding="xs">
      <Flex align="center" gap="xs" wrap>
        <IconButton icon={Bold} aria-label="加粗" />
        <IconButton icon={Italic} aria-label="斜体" />
        <IconButton icon={Underline} aria-label="下划线" />
        <IconButton icon={Link2} aria-label="插入链接" />
        <Separator orientation="vertical" />
        <IconButton icon={AlignLeft} aria-label="左对齐" />
        <IconButton icon={AlignCenter} aria-label="居中" />
        <IconButton icon={AlignRight} aria-label="右对齐" />
      </Flex>
    </Card>
    <Flex align="center" gap="sm" wrap>
      <IconButton icon={Pencil} variant="solid" tone="accent" aria-label="编辑" />
      <IconButton icon={Share2} variant="soft" aria-label="分享" />
      <IconButton icon={Settings} variant="surface" aria-label="设置" />
      <IconButton icon={MoreHorizontal} variant="outline" aria-label="更多" />
      <IconButton icon={Heart} variant="soft" tone="danger" radius="full" aria-label="收藏" />
      <IconButton icon={Trash2} tone="danger" aria-label="删除" />
    </Flex>
  </Flex>
));
