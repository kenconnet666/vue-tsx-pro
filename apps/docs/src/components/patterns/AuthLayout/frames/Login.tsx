// 认证页版式：左边品牌区、右边表单，工具在表单区的上角；窄屏时品牌区收成顶部一块
import { TrendingDown } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  Card,
  Flex,
  H1,
  H2,
  Icon,
  Paragraph,
  TextField,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { AuthLayout } from '@zerodep-dev/vue-tsx-pro-ui/patterns';

const styles = css.create({
  hero: {
    boxSizing: 'border-box',
    height: '_full',
    padding: '_xl',
    backgroundColor: '_accentSoft',
  },
  card: { width: 'min(24rem, 100%)' },
  // 示例嵌在文档页里，不占满一屏
  frame: { minHeight: '24rem' },
});

export default _component(() => () => (
  <AuthLayout
    sx={styles.frame}
    propsHero={{ sx: styles.hero }}
    hero={
      <Flex direction="column" gap="md">
        <Flex align="center" gap="sm">
          <Icon icon={TrendingDown} />
          联合降本
        </Flex>
        <H1 size="xl">让每一笔降本都看得见</H1>
        <Paragraph tone="muted">品牌区铺满左半边，窄屏时收成顶部一块。</Paragraph>
      </Flex>
    }
  >
    <Card sx={styles.card}>
      <Flex direction="column" gap="md">
        <H2 size="lg">账号登录</H2>
        <TextField placeholder="工号" />
        <TextField type="password" placeholder="密码" />
        <Button>登录</Button>
      </Flex>
    </Card>
  </AuthLayout>
));
