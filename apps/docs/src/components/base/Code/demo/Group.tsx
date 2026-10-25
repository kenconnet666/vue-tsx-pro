import { _component } from '@vue-tsx-pro/tsx';
import { Flex } from '@vue-tsx-pro/ui';
import { CodeGroup } from '@vue-tsx-pro/ui/docs-kit';

export default _component(() => {
  // 两组绑同一个变量：在一组里选了包管理器，另一组跟着切换
  let manager = _state('pnpm');
  return () => (
    <Flex direction="column" gap="md">
      <CodeGroup
        _value={_bind(manager)}
        items={[
          { label: 'pnpm', code: 'pnpm add @vue-tsx-pro/ui @vue-tsx-pro/tsx', lang: 'bash' },
          { label: 'npm', code: 'npm install @vue-tsx-pro/ui @vue-tsx-pro/tsx', lang: 'bash' },
          { label: 'yarn', code: 'yarn add @vue-tsx-pro/ui @vue-tsx-pro/tsx', lang: 'bash' },
        ]}
      />
      <CodeGroup
        _value={_bind(manager)}
        items={[
          {
            label: 'pnpm',
            code: 'pnpm add @vue-tsx-pro/ui @vue-tsx-pro/tsx',
            lang: 'bash',
          },
          {
            label: 'npm',
            code: 'npm install @vue-tsx-pro/ui @vue-tsx-pro/tsx',
            lang: 'bash',
          },
          {
            label: 'yarn',
            code: 'yarn add @vue-tsx-pro/ui @vue-tsx-pro/tsx',
            lang: 'bash',
          },
        ]}
      />
    </Flex>
  );
});
