import { FolderOpen, Inbox, Plus, SearchX } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Button, Card, Empty, Grid, Link, Text } from '@zerodep-dev/vue-tsx-pro-ui';

export default _component(() => () => (
  <Grid minItemWidth="14em" gap="md">
    <Card>
      <Empty
        icon={Inbox}
        title="还没有订单"
        description="顾客下单后会显示在这里，也可以先手动录入一张。"
        action={
          <Button size="sm" icon={Plus}>
            新建订单
          </Button>
        }
      />
    </Card>
    <Card>
      <Empty
        icon={SearchX}
        size="sm"
        title="没有找到“vue-tsx”"
        description="换个关键词，或者检查拼写。"
        action={
          <Text size="sm">
            试试 <Link href="/components/empty">button</Link>
          </Text>
        }
      />
    </Card>
    <Card>
      <Empty icon={FolderOpen} size="sm" title="文件夹是空的" />
    </Card>
  </Grid>
));
