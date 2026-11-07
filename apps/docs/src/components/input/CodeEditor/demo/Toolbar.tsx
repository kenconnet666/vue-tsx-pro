// 外面的工具栏：onReady 拿到编辑器，撤销、重做，在光标处插入一段（edit 当作用户的修改：进撤销历史、写回 _value）；
// 右边是只读的编辑器（能选中、复制、搜索，不能改）
import { MessageSquarePlus, Redo2, Undo2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Button, Flex, Grid, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { CodeEditor, type CodeEditorHandle } from '@zerodep-dev/vue-tsx-pro-ui/code-editor';

const styles = css.create({ editor: { height: '12rem' } });

const source = `export function total(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price * item.count, 0);
}
`;

export default _component(() => {
  let code = _state(source);
  let editor: CodeEditorHandle | undefined;
  const insert = () => {
    if (!editor) return;
    const at = editor.view.state.selection.main.head;
    editor.edit([{ from: at, to: at, insert: '// TODO: 会员折扣\n' }]);
    editor.view.focus();
  };
  return () => (
    <Grid minItemWidth="18rem" gap="md">
      <Flex direction="column" gap="sm">
        <Flex gap="xs" wrap>
          <Button
            size="sm"
            variant="outline"
            tone="neutral"
            icon={Undo2}
            onClick={() => editor?.undo()}
          >
            撤销
          </Button>
          <Button
            size="sm"
            variant="outline"
            tone="neutral"
            icon={Redo2}
            onClick={() => editor?.redo()}
          >
            重做
          </Button>
          <Button
            size="sm"
            variant="outline"
            tone="neutral"
            icon={MessageSquarePlus}
            onClick={insert}
          >
            插入注释
          </Button>
        </Flex>
        <CodeEditor
          _value={code}
          aria-label="计算总价"
          sx={styles.editor}
          onReady={(handle) => (editor = handle)}
        />
        <Small tone="muted">{code.trimEnd().split('\n').length} 行</Small>
      </Flex>
      <Flex direction="column" gap="sm">
        <Small tone="muted">只读：生成的类型声明</Small>
        <CodeEditor
          _value={'export interface Item {\n  price: number;\n  count: number;\n}\n'}
          readonly
          aria-label="类型声明（只读）"
          sx={styles.editor}
        />
      </Flex>
    </Grid>
  );
});
