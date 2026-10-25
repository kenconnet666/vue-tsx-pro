// Provider 也能局部换掉代码高亮器（highlighter）、关掉点击波纹（ripple）；不写的配置沿用上一层
import { _component } from '@vue-tsx-pro/tsx';
import {
  Button,
  Card,
  CodeBlock,
  Flex,
  Provider,
  Small,
  Switch,
  type Highlighter,
} from '@vue-tsx-pro/ui';
import { colors } from '@vue-tsx-pro/ui/tokens';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escape = (text: string) => text.replace(/[&<>"]/g, (char) => ESCAPES[char]!);

const LEVELS: Record<string, string> = {
  ERROR: colors.dangerText,
  WARN: colors.warningText,
  INFO: colors.accentText,
};

/** 只认日志级别的高亮器：返回只含 span 与 br 的 HTML，代码里的文字由它自己转义 */
const logHighlighter: Highlighter = async (code) =>
  code
    .split('\n')
    .map((line) =>
      escape(line).replace(
        /\b(ERROR|WARN|INFO)\b/,
        (level) => `<span style="color:${LEVELS[level]};font-weight:600">${level}</span>`,
      ),
    )
    .join('<br>');

const log = `10:24:01 INFO  server started on :8080
10:24:07 WARN  slow query: 1.8s SELECT * FROM orders
10:24:09 ERROR payment callback timed out (order 1024)
10:24:12 INFO  retry succeeded`;

export default _component(() => {
  let ripple = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Provider highlighter={logHighlighter}>
        <CodeBlock code={log} lang="log" title="server.log" />
      </Provider>
      <Card padding="sm">
        <Flex align="center" gap="md" wrap>
          <Switch _checked={_bind(ripple)}>点击波纹</Switch>
          <Provider ripple={ripple}>
            <Flex gap="sm">
              <Button>保存</Button>
              <Button variant="soft">预览</Button>
            </Flex>
          </Provider>
          <Small tone="muted">只影响这一层里的按钮</Small>
        </Flex>
      </Card>
    </Flex>
  );
});
