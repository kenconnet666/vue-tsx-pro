// JSON 配置：改动即时校验，格式不对时说出在哪儿，点一下跳过去（onReady 拿到编辑器，goTo 定位并聚焦）。
// 不给 language 时按 TSX 高亮，JSON 也认得；要专门的 JSON 语言（折叠、括号）时装 @codemirror/lang-json 传 json()
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { Alert, Button, Flex, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { CodeEditor, type CodeEditorHandle } from '@zerodep-dev/vue-tsx-pro-ui/code-editor';

const styles = css.create({ editor: { height: '14rem' } });

const initial = `{
  "name": "采购审批",
  "steps": ["提交", "部门经理", "财务复核"],
  "timeoutDays": 3,
}`;

/** JSON.parse 的出错位置换成行、列：各浏览器的写法不同（字符位置或行列），Safari 不给位置 */
function locate(message: string, code: string): { line: number; column: number } | null {
  const lineColumn = /line (\d+) column (\d+)/.exec(message);
  if (lineColumn) return { line: Number(lineColumn[1]), column: Number(lineColumn[2]) };
  const position = /position (\d+)/.exec(message);
  if (!position) return null;
  const before = code.slice(0, Number(position[1])).split('\n');
  return { line: before.length, column: before.at(-1)!.length + 1 };
}

function check(code: string) {
  try {
    return { fields: Object.keys(JSON.parse(code) as object).length };
  } catch (error) {
    const message = (error as Error).message;
    return { message, at: locate(message, code) };
  }
}

export default _component(() => {
  let code = _state(initial);
  let editor: CodeEditorHandle | undefined;
  return () => {
    const result = check(code);
    return (
      <Flex direction="column" gap="sm">
        <CodeEditor
          _value={code}
          aria-label="流程配置（JSON）"
          sx={styles.editor}
          onReady={(handle) => (editor = handle)}
        />
        {'fields' in result ? (
          <Small tone="muted">格式正确，{result.fields} 个字段</Small>
        ) : (
          <Alert
            tone="danger"
            title="JSON 格式不对"
            description={result.message}
            action={
              result.at && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => editor?.goTo(result.at!.line, result.at!.column)}
                >
                  跳到第 {result.at.line} 行
                </Button>
              )
            }
          />
        )}
      </Flex>
    );
  };
});
