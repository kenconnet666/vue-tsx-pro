/** 首页（mode: 'ssr'）：每次请求在服务端渲染，数据来自 loader，浏览器水合后按钮可点 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Flex, FlexList, H1, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { usePageData } from '../data.ts';

export default _component(() => {
  const data = usePageData('/');
  let count = _state(0);
  return () => (
    <Flex direction="column" gap="md" align="start">
      <H1>首页</H1>
      <Paragraph>这一页在服务端渲染，浏览器接管（水合）后按钮才有反应。</Paragraph>
      {data.value && (
        <>
          <Paragraph data-testid="visits">
            访问量 {data.value.visits.toString()}（{typeof data.value.visits}），渲染于{' '}
            {data.value.renderedAt}
          </Paragraph>
          <FlexList direction="column" gap="xs">
            {data.value.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </FlexList>
        </>
      )}
      <Button onClick={() => count++}>点了 {count} 次</Button>
    </Flex>
  );
});
