import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex } from '@zerodep-dev/vue-tsx-pro-ui';
import { CodeGroup, type CodeGroupItem } from '@zerodep-dev/vue-tsx-pro-ui/docs-kit';

const packages = '@zerodep-dev/vue-tsx-pro-tsx @zerodep-dev/vue-tsx-pro-ui';
const install: CodeGroupItem[] = [
  { label: 'pnpm', code: `pnpm add ${packages}`, lang: 'bash' },
  { label: 'npm', code: `npm install ${packages}`, lang: 'bash' },
  { label: 'yarn', code: `yarn add ${packages}`, lang: 'bash' },
];
const dev: CodeGroupItem[] = [
  { label: 'pnpm', code: 'pnpm dev', lang: 'bash' },
  { label: 'npm', code: 'npm run dev', lang: 'bash' },
  { label: 'yarn', code: 'yarn dev', lang: 'bash' },
];

export default _component(() => {
  // 两组绑同一个变量：在一组里选了包管理器，另一组跟着切换
  let manager = _state('pnpm');
  return () => (
    <Flex direction="column" gap="md">
      <CodeGroup _value={manager} items={install} />
      <CodeGroup _value={manager} items={dev} />
    </Flex>
  );
});
