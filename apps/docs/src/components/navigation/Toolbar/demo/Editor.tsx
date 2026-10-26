import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Link2,
  Redo2,
  Underline,
  Undo2,
} from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  Flex,
  IconButton,
  Select,
  Separator,
  Small,
  ToggleGroup,
  ToggleItem,
  Toolbar,
} from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({ font: { width: '7rem' } });

export default _component(() => {
  let font = _state('正文');
  let marks = _state<string[]>(['bold']);
  let align = _state('left');
  return () => (
    <Flex direction="column" gap="sm">
      <Card padding="xs">
        <Toolbar aria-label="文字格式" gap="xs">
          <IconButton icon={Undo2} aria-label="撤销" />
          <IconButton icon={Redo2} aria-label="重做" />
          <Separator orientation="vertical" />
          <Select
            items={['正文', '标题 1', '标题 2', '引用']}
            _value={font}
            size="sm"
            aria-label="段落样式"
            propsRoot={{ sx: styles.font }}
          />
          <Separator orientation="vertical" />
          <ToggleGroup selectionMode="multiple" _value={marks} size="sm" aria-label="字形">
            <ToggleItem value="bold" icon={Bold} aria-label="加粗" />
            <ToggleItem value="italic" icon={Italic} aria-label="斜体" />
            <ToggleItem value="underline" icon={Underline} aria-label="下划线" />
          </ToggleGroup>
          <ToggleGroup _value={align} required size="sm" aria-label="对齐">
            <ToggleItem value="left" icon={AlignLeft} aria-label="左对齐" />
            <ToggleItem value="center" icon={AlignCenter} aria-label="居中" />
            <ToggleItem value="right" icon={AlignRight} aria-label="右对齐" />
          </ToggleGroup>
          <Separator orientation="vertical" />
          <IconButton icon={Link2} aria-label="插入链接" />
        </Toolbar>
      </Card>
      <Small tone="muted">
        {font} · {marks.length ? marks.join('、') : '无字形'} · {align}
      </Small>
    </Flex>
  );
});
