// 上下排列：上面编辑、下面预览（带编号的行渲染成有序列表，放在 Prose 里）；上栏可以收起，比例范围 30%–70%
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Card,
  ListItem,
  OrderedList,
  Paragraph,
  Prose,
  ScrollArea,
  Small,
  Splitter,
  Textarea,
} from '@zerodep-dev/vue-tsx-pro-ui';

const styles = css.create({
  frame: { height: '18rem' },
  pane: { padding: '_sm', height: '100%', boxSizing: 'border-box' },
  // 编辑框占满上栏：外壳撑满，文字区随外壳拉伸（fixed：高度不随内容变）
  editor: { width: '100%', height: '100%' },
  preview: { height: '100%' },
});

const NUMBERED = /^\d+[.、]\s*/;

/** 文字按行渲染：连续的带编号的行是一个有序列表，其余每行一段 */
function preview(text: string) {
  const blocks: (string | string[])[] = [];
  for (const line of text.split('\n').filter((item) => item.trim())) {
    const last = blocks.at(-1);
    if (NUMBERED.test(line)) {
      if (Array.isArray(last)) last.push(line.replace(NUMBERED, ''));
      else blocks.push([line.replace(NUMBERED, '')]);
    } else blocks.push(line);
  }
  return blocks.map((block) =>
    Array.isArray(block) ? (
      <OrderedList>
        {block.map((item) => (
          <ListItem>{item}</ListItem>
        ))}
      </OrderedList>
    ) : (
      <Paragraph>{block}</Paragraph>
    ),
  );
}

export default _component(() => {
  let text = _state(
    '改进方案：\n1. 卡箍改用铝合金\n2. 合并两件支架，减少紧固件\n3. 线束改走机柜背面',
  );
  let size = _state(50);
  return () => (
    <Card variant="outline" padding="none" radius="md">
      <Splitter
        sx={styles.frame}
        orientation="vertical"
        _size={size}
        minSize={30}
        maxSize={70}
        collapsible="start"
        start={
          <div {...css.attrs(styles.pane)}>
            <Textarea _value={text} aria-label="方案" fixed propsRoot={{ sx: styles.editor }} />
          </div>
        }
        end={
          <ScrollArea sx={styles.preview} propsViewport={{ 'aria-label': '预览' }}>
            <div {...css.attrs(styles.pane)}>
              <Small tone="muted">预览（上栏 {size}%）</Small>
              <Prose>{preview(text)}</Prose>
            </div>
          </ScrollArea>
        }
      />
    </Card>
  );
});
