import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Paragraph>
    运行 <Code>pnpm add @zerodep-dev/vue-tsx-pro-ui</Code> 安装，然后在 <Code>main.ts</Code> 里调用{' '}
    <Code>app.use(createUi())</Code>。
  </Paragraph>
));
