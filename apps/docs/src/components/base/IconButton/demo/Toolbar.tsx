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
import { _component } from '@vue-tsx-pro/tsx';
import { Flex, IconButton, Separator, Text, type TextSize } from '@vue-tsx-pro/ui';

const sizes: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export default _component(() => () => (
  <Flex direction="column" gap="lg">
    {/* 编辑器工具栏：默认 ghost，一组按钮之间用分隔线隔开 */}
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
    <Flex align="center" gap="sm" wrap>
      <Text size="xs" tone="muted">
        样式
      </Text>
      <IconButton icon={Pencil} variant="solid" tone="accent" aria-label="编辑" />
      <IconButton icon={Share2} variant="soft" aria-label="分享" />
      <IconButton icon={Settings} variant="surface" aria-label="设置" />
      <IconButton icon={MoreHorizontal} variant="outline" aria-label="更多" />
      <IconButton icon={Heart} variant="soft" tone="danger" radius="full" aria-label="收藏" />
      <IconButton icon={Trash2} tone="danger" aria-label="删除" />
    </Flex>
    <Flex align="center" gap="sm" wrap>
      <Text size="xs" tone="muted">
        尺寸
      </Text>
      {sizes.map((size) => (
        <IconButton
          key={size}
          icon={Settings}
          size={size}
          variant="surface"
          aria-label={`设置（${size}）`}
        />
      ))}
    </Flex>
  </Flex>
));
