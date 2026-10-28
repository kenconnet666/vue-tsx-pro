/** 服务端渲染出错的页面（mode: 'ssr'）：服务端记下错误、改发空壳，浏览器照样渲染出来 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Flex, H1, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => {
  if (import.meta.env.SSR) throw new Error('示例：这一页在服务端渲染时出错');
  return () => (
    <Flex direction="column" gap="md">
      <H1>出错退回</H1>
      <Paragraph>服务端渲染这一页时出错了，发的是空壳，由浏览器渲染。</Paragraph>
    </Flex>
  );
});
