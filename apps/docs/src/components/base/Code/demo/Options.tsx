// 长行换行（wrap）而不是横向滚动；copyable 关掉复制按钮；
// highlight 为 false 时按纯文本显示，改回 true 才交给高亮器（看不见的代码可以等要显示时再高亮）
import { _component } from '@vue-tsx-pro/tsx';
import { CodeBlock, Flex, Switch } from '@vue-tsx-pro/ui';

const source = `curl -X POST https://api.example.com/v1/projects/42/deployments -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"ref":"main","environment":"production","notify":true}'`;

export default _component(() => {
  let wrap = _state(true);
  let copyable = _state(true);
  let highlight = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Flex gap="lg" wrap>
        <Switch _checked={wrap}>自动换行</Switch>
        <Switch _checked={copyable}>复制按钮</Switch>
        <Switch _checked={highlight}>语法高亮</Switch>
      </Flex>
      <CodeBlock code={source} lang="bash" wrap={wrap} copyable={copyable} highlight={highlight} />
    </Flex>
  );
});
