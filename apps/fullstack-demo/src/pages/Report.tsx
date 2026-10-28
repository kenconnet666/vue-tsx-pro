/** 报表（mode: 'csr'）：服务端只发空壳，整页在浏览器里渲染，可以直接用只有浏览器才有的东西 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, H1, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <H1>报表</H1>
    <Paragraph>这一页只在浏览器里渲染：窗口宽 {window.innerWidth} 像素。</Paragraph>
  </Flex>
));
