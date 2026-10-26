import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Breadcrumbs,
  Card,
  defineLang,
  enUS,
  Flex,
  Provider,
  Slider,
  Small,
  Steps,
} from '@zerodep-dev/vue-tsx-pro-ui';

// 从右到左的语言：只改方向，文字仍用英文（示例里不放阿拉伯文、希伯来文）
const rtl = defineLang(enUS, { code: 'ar', direction: 'rtl' });

export default _component(() => {
  let volume = _state(30);
  return () => (
    <Card padding="sm">
      <Provider lang={rtl}>
        <Flex direction="column" gap="md">
          <Small tone="muted">dir="rtl"：布局、箭头、方向键都镜像过来</Small>
          <Breadcrumbs
            aria-label="Location"
            items={[
              { label: 'Home', href: '#home' },
              { label: 'Orders', href: '#orders' },
              { label: '#1024' },
            ]}
          />
          <Steps _current={1} items={[{ title: 'Cart' }, { title: 'Address' }, { title: 'Pay' }]} />
          <Slider _value={volume} aria-label="Volume" />
        </Flex>
      </Provider>
    </Card>
  );
});
