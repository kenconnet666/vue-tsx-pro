// 中间放 logo（纠错自动用 H）；color、bgColor 换颜色，深色模块配浅色底才好扫
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Avatar, Flex, Icon, QRCode, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { Store } from '@lucide/icons';

const items = [
  { title: '图片地址', node: <QRCode value="https://zerodep.dev/app" logo="/favicon.svg" /> },
  {
    title: '头像',
    node: (
      <QRCode
        value="https://zerodep.dev/u/lin-xiaoman"
        logo={<Avatar name="林小满" size="sm" />}
        logoSize={0.26}
      />
    ),
  },
  {
    title: '自定义颜色',
    node: (
      <QRCode
        value="https://zerodep.dev/store/42"
        logo={<Icon icon={Store} />}
        color="#1d4ed8"
        bgColor="#eff6ff"
      />
    ),
  },
];

export default _component(() => () => (
  <Flex gap="lg" wrap>
    {items.map((item) => (
      <Flex key={item.title} direction="column" align="center" gap="xs">
        {item.node}
        <Small tone="muted">{item.title}</Small>
      </Flex>
    ))}
  </Flex>
));
