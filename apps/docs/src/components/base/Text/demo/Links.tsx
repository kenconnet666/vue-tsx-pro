import { _component } from '@vue-tsx-pro/tsx';
import { Flex, Link, Paragraph, Text } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="md">
    <Paragraph>
      正文里的链接默认带下划线：<Link href="/components/button">按钮</Link>、
      <Link href="/guide/theming">主题定制</Link>
      ，不只靠颜色和周围的文字区分。去别的站点写{' '}
      <Link href="https://vuejs.org" external>
        Vue 文档
      </Link>
      ：新窗口打开，带图标，读屏会念出“在新窗口打开”。
    </Paragraph>
    <Flex gap="lg" wrap>
      <Text size="sm">
        <Link href="/components/text" underline="hover">
          悬停时才有下划线
        </Link>
      </Text>
      <Text size="sm">
        <Link href="/components/text" underline="none" tone="muted">
          导航里的次要链接
        </Link>
      </Text>
      <Text size="sm">
        <Link href="/components/text" tone="danger">
          注销账户
        </Link>
      </Text>
    </Flex>
  </Flex>
));
