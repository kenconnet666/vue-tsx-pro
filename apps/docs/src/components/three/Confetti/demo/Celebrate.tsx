// 庆祝：从点的按钮处喷出；支付成功的对话框打开时从两个下角斜着喷，彩纸在顶层，盖得住对话框
import { PartyPopper } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import { Button, Dialog, Flex, Paragraph } from '@vue-tsx-pro/ui';
import { Confetti, type ConfettiOrigin } from '@vue-tsx-pro/ui/three';

export default _component(() => {
  let fromButton = _state(0);
  let origin = _state<ConfettiOrigin>({ x: 0.5, y: 0.6 });
  let corners = _state(0);
  let paid = _state(false);

  function celebrate(event: MouseEvent) {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    origin = {
      x: (box.left + box.width / 2) / innerWidth,
      y: (box.top + box.height / 2) / innerHeight,
    };
    fromButton++;
  }

  function pay() {
    paid = true;
    corners++;
  }

  return () => (
    <Flex gap="md" wrap>
      <Button icon={PartyPopper} onClick={celebrate}>
        完成任务
      </Button>
      <Button variant="soft" onClick={pay}>
        支付 ¥ 99
      </Button>
      <Confetti trigger={fromButton} origin={origin} />
      {/* 两个下角各放一批：同一个 trigger，方向相反 */}
      <Confetti trigger={corners} origin={{ x: 0, y: 1 }} angle={60} spread={50} count={120} />
      <Confetti trigger={corners} origin={{ x: 1, y: 1 }} angle={120} spread={50} count={120} />
      <Dialog
        _open={_bind(paid)}
        size="xs"
        title="支付成功"
        footer={<Button onClick={() => (paid = false)}>好的</Button>}
      >
        <Paragraph>订单 #20261021 已支付，预计明天送达。</Paragraph>
      </Dialog>
    </Flex>
  );
});
