import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitMerge,
  Italic,
  List,
  ListOrdered,
  Minus,
  Plus,
  Redo2,
  Underline,
  Undo2,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, ButtonGroup, Flex, IconButton, Toolbar } from '@vue-tsx-pro/ui';

export default _component(() => {
  let page = _state(3);
  let zoom = _state(100);

  return () => (
    <Flex direction="column" gap="lg">
      <Toolbar gap="sm" aria-label="编辑器工具栏">
        <ButtonGroup variant="surface" tone="neutral" aria-label="撤销">
          <IconButton icon={Undo2} aria-label="撤销" />
          <IconButton icon={Redo2} aria-label="重做" />
        </ButtonGroup>
        <ButtonGroup variant="surface" tone="neutral" aria-label="字形">
          <IconButton icon={Bold} aria-label="加粗" />
          <IconButton icon={Italic} aria-label="斜体" />
          <IconButton icon={Underline} aria-label="下划线" />
        </ButtonGroup>
        <ButtonGroup variant="surface" tone="neutral" aria-label="列表">
          <IconButton icon={List} aria-label="无序列表" />
          <IconButton icon={ListOrdered} aria-label="有序列表" />
        </ButtonGroup>
        <ButtonGroup variant="surface" tone="neutral" aria-label="对齐">
          <IconButton icon={AlignLeft} aria-label="左对齐" />
          <IconButton icon={AlignCenter} aria-label="居中" />
          <IconButton icon={AlignRight} aria-label="右对齐" />
        </ButtonGroup>
      </Toolbar>
      <Flex gap="lg" wrap align="start">
        <Flex direction="column" gap="md" align="start">
          <ButtonGroup aria-label="合并">
            <Button icon={GitMerge}>合并请求</Button>
            <IconButton variant="solid" icon={ChevronDown} aria-label="更多合并方式" />
          </ButtonGroup>
          <ButtonGroup variant="outline" tone="neutral" aria-label="翻页">
            <IconButton
              icon={ChevronLeft}
              aria-label="上一页"
              onClick={() => (page = Math.max(1, page - 1))}
            />
            <Button>第 {page} 页</Button>
            <IconButton icon={ChevronRight} aria-label="下一页" onClick={() => page++} />
          </ButtonGroup>
          <ButtonGroup variant="surface" tone="neutral" size="sm" aria-label="缩放">
            <IconButton
              icon={Minus}
              aria-label="缩小"
              onClick={() => (zoom = Math.max(25, zoom - 25))}
            />
            <Button onClick={() => (zoom = 100)}>{zoom}%</Button>
            <IconButton
              icon={Plus}
              aria-label="放大"
              onClick={() => (zoom = Math.min(400, zoom + 25))}
            />
          </ButtonGroup>
        </Flex>
        <ButtonGroup orientation="vertical" variant="outline" tone="neutral" aria-label="导出">
          <Button>导出 PDF</Button>
          <Button>导出 Word</Button>
          <Button>导出 Markdown</Button>
        </ButtonGroup>
      </Flex>
    </Flex>
  );
});
