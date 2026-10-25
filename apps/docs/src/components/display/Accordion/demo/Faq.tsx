import { _component } from '@vue-tsx-pro/tsx';
import { Accordion, AccordionItem, Card, Link, Paragraph } from '@vue-tsx-pro/ui';

export default _component(() => {
  let open = _state('ship');
  return () => (
    <Card padding="none">
      <Accordion _value={_bind(open)} aria-label="常见问题">
        <AccordionItem value="ship" title="付款后多久发货？">
          <Paragraph>工作日 16:00 前付款当天发货，之后的次日发货；节假日顺延。</Paragraph>
        </AccordionItem>
        <AccordionItem value="refund" title="怎么申请退款？">
          <Paragraph>
            在订单详情里点“申请售后”，选择退款原因。审核通过后 1–3 个工作日原路退回，进度在
            <Link href="/components/accordion">我的售后</Link>里查看。
          </Paragraph>
        </AccordionItem>
        <AccordionItem value="invoice" title="可以开发票吗？">
          <Paragraph>可以。下单时填写抬头与税号，电子发票会在发货后发到邮箱。</Paragraph>
        </AccordionItem>
        <AccordionItem value="member" title="会员有什么权益？" disabled>
          <Paragraph>会员计划正在调整，敬请期待。</Paragraph>
        </AccordionItem>
      </Accordion>
    </Card>
  );
});
