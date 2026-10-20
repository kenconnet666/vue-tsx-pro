import { _component } from '@vue-tsx-pro/tsx';
import { Alert, Flex, Link } from '@vue-tsx-pro/ui';

export default _component(() => () => (
  <Flex direction="column" gap="sm">
    <Alert tone="info" title="维护通知">
      本周六 02:00–04:00 系统升级，期间无法下单。
    </Alert>
    <Alert tone="success" title="付款成功">
      订单 #10234 已付款 ¥1,280.00，预计明天发货。
    </Alert>
    <Alert tone="warning" title="订阅即将到期">
      你的专业版将在 3 天后到期，<Link href="/components/alert">现在续费</Link>可享 8 折。
    </Alert>
    <Alert tone="danger" title="同步失败">
      网络连接中断，3 个文件没有上传。
    </Alert>
    <Alert tone="neutral">没有标题时只显示正文：适合一行就说清楚的提示。</Alert>
  </Flex>
));
