import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Strikethrough,
  Underline,
} from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, Flex, Paragraph, ToggleGroup, ToggleItem } from '@vue-tsx-pro/ui';

const styles = stylex.create({
  bold: { fontWeight: '_bold' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  strike: { textDecorationLine: 'line-through' },
  both: { textDecorationLine: 'underline line-through' },
});

const alignStyles = stylex.create({
  left: { textAlign: 'left' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },
  justify: { textAlign: 'justify' },
});

export default _component(() => {
  let marks = _state<string[]>(['bold']);
  let align = _state<keyof typeof alignStyles>('left');
  return () => {
    const has = (mark: string) => marks.includes(mark);
    return (
      <Flex direction="column" gap="md">
        <Flex gap="sm" wrap>
          {/* 多选：每一项各自开关 */}
          <ToggleGroup selectionMode="multiple" value={_bind(marks)} aria-label="字形">
            <ToggleItem value="bold" icon={Bold} aria-label="加粗" />
            <ToggleItem value="italic" icon={Italic} aria-label="斜体" />
            <ToggleItem value="underline" icon={Underline} aria-label="下划线" />
            <ToggleItem value="strike" icon={Strikethrough} aria-label="删除线" />
          </ToggleGroup>
          <ToggleGroup value={_bind(align)} required aria-label="对齐">
            <ToggleItem value="left" icon={AlignLeft} aria-label="左对齐" />
            <ToggleItem value="center" icon={AlignCenter} aria-label="居中" />
            <ToggleItem value="right" icon={AlignRight} aria-label="右对齐" />
            <ToggleItem value="justify" icon={AlignJustify} aria-label="两端对齐" />
          </ToggleGroup>
        </Flex>
        <Card>
          <Paragraph
            sx={[
              has('bold') && styles.bold,
              has('italic') && styles.italic,
              has('underline') && (has('strike') ? styles.both : styles.underline),
              has('strike') && !has('underline') && styles.strike,
              alignStyles[align],
            ]}
          >
            分段控件是一组互斥或可多选的按钮：方向键在组内移动，整组只占一个 Tab
            位置。只有图标的项要写 aria-label。
          </Paragraph>
        </Card>
      </Flex>
    );
  };
});
