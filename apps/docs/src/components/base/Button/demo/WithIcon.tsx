import {
  ArrowRight,
  ChevronDown,
  Download,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Badge, Button, Flex, IconButton, Kbd } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Flex gap="sm" wrap align="center">
      <Button icon={Plus}>新建</Button>
      <Button variant="soft" icon={Download}>
        下载
      </Button>
      <Button variant="outline" tone="neutral" iconEnd={ChevronDown}>
        更多
      </Button>
      <Button variant="ghost" iconEnd={ArrowRight}>
        下一步
      </Button>
      <Button variant="link" iconEnd={ExternalLink}>
        查看文档
      </Button>
    </Flex>
    <Flex gap="sm" wrap align="center">
      <Button variant="surface" tone="neutral" icon={Search}>
        搜索 <Kbd>Ctrl K</Kbd>
      </Button>
      <Button variant="soft" tone="neutral">
        未读消息{' '}
        <Badge variant="solid" tone="danger" radius="full">
          12
        </Badge>
      </Button>
      <IconButton icon={Pencil} aria-label="编辑" />
      <IconButton icon={Share2} aria-label="分享" />
      <IconButton icon={Trash2} tone="danger" aria-label="删除" />
    </Flex>
  </Flex>
));
