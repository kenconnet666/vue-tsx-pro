import { Minus, Plus } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { AnimatedNumber, CodePreview, Flex, IconButton, Small } from '@vue-tsx-pro/ui';

// 示例卡片：效果与源码由使用方各自给出；文档站用 Vite 的 ?raw 导入同一个文件，两者永远一致
const source = `let count = _state(0);
<IconButton icon={Minus} aria-label="减少" onClick={() => count--} />
<AnimatedNumber value={count} />
<IconButton icon={Plus} aria-label="增加" onClick={() => count++} />`;

export default _component(() => {
  let count = _state(3);
  let showCode = _state(false);
  return () => (
    <Flex direction="column" gap="sm">
      <CodePreview code={source} lang="tsx" align="center" showCode={_bind(showCode)}>
        <Flex align="center" gap="md">
          <IconButton icon={Minus} variant="surface" aria-label="减少" onClick={() => count--} />
          <AnimatedNumber value={count} />
          <IconButton icon={Plus} variant="surface" aria-label="增加" onClick={() => count++} />
        </Flex>
      </CodePreview>
      <Small tone="muted">源码{showCode ? '已展开' : '已收起'}</Small>
    </Flex>
  );
});
