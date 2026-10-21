// 带文字的分隔线：居中的“或者”分开两种登录方式；文字靠起始边时像一节的小标题，线在后面伸展
import { MessageSquareText, Smartphone } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Card, Descriptions, Flex, Grid, Separator, TextField } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Grid minItemWidth="16rem" gap="md">
    <Card>
      <Flex direction="column" gap="md">
        <TextField placeholder="工号或邮箱" aria-label="账号" />
        <TextField type="password" placeholder="密码" aria-label="密码" />
        <Button>登录</Button>
        <Separator>或者</Separator>
        <Grid columns={2} gap="sm">
          <Button variant="outline" tone="neutral" icon={MessageSquareText}>
            企业微信
          </Button>
          <Button variant="outline" tone="neutral" icon={Smartphone}>
            短信验证码
          </Button>
        </Grid>
      </Flex>
    </Card>
    <Card>
      <Flex direction="column" gap="md">
        <Separator labelAlign="start">更改前</Separator>
        <Descriptions
          columns={1}
          size="sm"
          items={[
            { label: '件号', value: 'G26' },
            { label: '材料', value: 'CFRP-T300' },
          ]}
        />
        <Separator labelAlign="start" decorative={false}>
          更改后
        </Separator>
        <Descriptions
          columns={1}
          size="sm"
          items={[
            { label: '件号', value: 'G29' },
            { label: '材料', value: 'CFRP-T700' },
          ]}
        />
      </Flex>
    </Card>
  </Grid>
));
