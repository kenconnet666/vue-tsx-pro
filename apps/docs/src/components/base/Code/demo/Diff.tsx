import { _component } from '@vue-tsx-pro/tsx';
import { CodeBlock, Flex } from '@vue-tsx-pro/ui';

const change = `export const Counter = _component(() => {
  const count = ref(0);
  let count = _state(0);
  return () => (
    <button onClick={() => count.value++}>{count.value}</button>
    <button onClick={() => count++}>{count}</button>
  );
});`;

const long = Array.from(
  { length: 40 },
  (_, index) => `  { id: ${index + 1}, name: '项目 ${index + 1}', done: ${index % 3 === 0} },`,
).join('\n');

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <CodeBlock
      code={change}
      lang="tsx"
      title="Counter.tsx：从 ref 换成符文"
      lineNumbers
      removedLines="2,5"
      addedLines="3,6"
    />
    <CodeBlock code={`const items = [\n${long}\n];`} lang="ts" title="data.ts" maxLines={8} />
  </Flex>
));
