/** 关于（mode: 'static'）：构建时预渲染成 HTML，线上直接发文件，浏览器水合 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, H1, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <H1>关于</H1>
    <Paragraph>这一页在构建时预渲染：内容不随请求变，线上直接发 HTML 文件。</Paragraph>
  </Flex>
));
