// 上下排列：上面编辑、下面预览；上栏可以收起，比例范围 30%–70%
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Small, Splitter, Textarea } from '@vue-tsx-pro/ui';

const styles = css.create({
  frame: {
    height: '18rem',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
  },
  pane: { padding: '_sm', height: '100%', boxSizing: 'border-box' },
  editor: { height: '100%' },
  preview: { whiteSpace: 'pre-wrap' },
});

export default _component(() => {
  let text = _state('改进方案：\n1. 卡箍改用铝合金\n2. 合并两件支架，减少紧固件');
  let size = _state(50);
  return () => (
    <Splitter
      sx={styles.frame}
      orientation="vertical"
      _size={size}
      minSize={30}
      maxSize={70}
      collapsible="start"
      start={
        <div {...css.attrs(styles.pane)}>
          <Textarea _value={text} aria-label="方案" sx={styles.editor} />
        </div>
      }
      end={
        <div {...css.attrs(styles.pane)}>
          <Small tone="muted">预览（上栏 {size}%）</Small>
          <div {...css.attrs(styles.preview)}>{text}</div>
        </div>
      }
    />
  );
});
