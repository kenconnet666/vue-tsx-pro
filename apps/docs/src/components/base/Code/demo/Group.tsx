import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex } from '@zerodep-dev/vue-tsx-pro-ui';
import { CodeGroup } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';

export default _component(() => {
  // 两组绑同一个变量：在一组里选了包管理器，另一组跟着切换
  let manager = _state('pnpm');
  return () => (
    <Flex direction="column" gap="md">
      <CodeGroup
        _value={manager}
        items={[
          {
            label: 'pnpm',
            code: 'pnpm add @zerodep-dev/vue-tsx-pro-ui @zerodep-dev/vue-tsx-pro-tsx',
            lang: 'bash',
          },
          {
            label: 'npm',
            code: 'npm install @zerodep-dev/vue-tsx-pro-ui @zerodep-dev/vue-tsx-pro-tsx',
            lang: 'bash',
          },
          {
            label: 'yarn',
            code: 'yarn add @zerodep-dev/vue-tsx-pro-ui @zerodep-dev/vue-tsx-pro-tsx',
            lang: 'bash',
          },
        ]}
      />
      <CodeGroup
        _value={manager}
        items={[
          {
            label: 'pnpm',
            code: 'pnpm add @zerodep-dev/vue-tsx-pro-ui @zerodep-dev/vue-tsx-pro-tsx',
            lang: 'bash',
          },
          {
            label: 'npm',
            code: 'npm install @zerodep-dev/vue-tsx-pro-ui @zerodep-dev/vue-tsx-pro-tsx',
            lang: 'bash',
          },
          {
            label: 'yarn',
            code: 'yarn add @zerodep-dev/vue-tsx-pro-ui @zerodep-dev/vue-tsx-pro-tsx',
            lang: 'bash',
          },
        ]}
      />
    </Flex>
  );
});
