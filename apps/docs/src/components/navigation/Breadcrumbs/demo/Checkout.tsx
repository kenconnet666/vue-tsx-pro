import { CreditCard, MapPin, PackageCheck, ShoppingCart } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Button, Card, Flex, Paragraph, Steps, type StepItem } from '@vue-tsx-pro/ui';

// satisfies 而不是标注类型：title 保持字符串，下面拼进句子里
const items = [
  { title: '购物车', description: '3 件商品', icon: ShoppingCart },
  { title: '收货地址', description: '上海市徐汇区', icon: MapPin },
  { title: '支付', description: '微信 / 支付宝', icon: CreditCard },
  { title: '完成', icon: PackageCheck },
] satisfies StepItem[];

const styles = css.create({ body: { minHeight: '4rem' } });

export default _component(() => {
  let step = _state(1);
  return () => (
    <Flex direction="column" gap="lg">
      <Steps items={items} current={_bind(step)} navigable />
      <Card>
        <Paragraph sx={styles.body}>
          {step < items.length - 1
            ? `第 ${step + 1} 步：${items[step]!.title}。已完成的步骤可以点回去修改。`
            : '订单已提交，预计明天送达。'}
        </Paragraph>
        <Flex justify="end" gap="sm">
          <Button variant="ghost" tone="neutral" disabled={step === 0} onClick={() => step--}>
            上一步
          </Button>
          <Button disabled={step === items.length - 1} onClick={() => step++}>
            {step === items.length - 2 ? '提交订单' : '下一步'}
          </Button>
        </Flex>
      </Card>
    </Flex>
  );
});
