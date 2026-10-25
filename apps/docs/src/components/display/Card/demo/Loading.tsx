import { _component } from '@vue-tsx-pro/tsx';
import { Card, Flex, Grid, H3, Paragraph, Small, Switch, type Space } from '@vue-tsx-pro/ui';

const paddings: Space[] = ['sm', 'md', 'lg'];

export default _component(() => {
  let loading = _state(true);
  return () => (
    <Flex direction="column" gap="md">
      <Switch _checked={loading}>加载中</Switch>
      <Grid minItemWidth="11em" gap="md">
        {paddings.map((padding) => (
          <Card
            key={padding}
            padding={padding}
            loading={loading}
            header={<H3 size="sm">padding="{padding}"</H3>}
          >
            <Paragraph size="sm">
              正文加载中换成几行扫光的骨架，页头照常显示，卡片带 aria-busy。
            </Paragraph>
            <Small tone="muted">很快完成的加载不出现骨架</Small>
          </Card>
        ))}
      </Grid>
    </Flex>
  );
});
