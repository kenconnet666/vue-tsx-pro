// 接口返回：订单详情。bigint 的编号、Decimal 的金额照实显示，日期是 ISO；点一项看它的路径，复制值或路径
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Card, JsonViewer } from '@zerodep-dev/vue-tsx-pro-ui';

/** 金额：自带 toFixed、toString 的数字对象（Decimal、Big 一类）按原样显示 */
class Amount {
  readonly #text: string;
  constructor(text: string) {
    this.#text = text;
  }
  toFixed() {
    return this.#text;
  }
  toString() {
    return this.#text;
  }
}

const response = {
  code: 'ok',
  data: {
    id: 9007199254740993n,
    number: 'SO-2026-11-0042',
    status: 'paid',
    customer: { name: '林小满', phone: '138****0000', vip: true },
    total: new Amount('1288.50'),
    placedAt: new Date('2026-11-08T08:30:00Z'),
    remark: null,
    'delivery-window': ['09:00', '12:00'],
    items: [
      { sku: 'MUG-01', name: '青瓷马克杯', qty: 2, price: new Amount('89.00') },
      { sku: 'TEA-12', name: '龙井 250g', qty: 1, price: new Amount('1110.50') },
    ],
    tags: new Set(['首单', '包邮']),
  },
};

export default _component(() => () => (
  <Card padding="sm">
    <JsonViewer value={response} expandDepth={2} aria-label="订单详情" />
  </Card>
));
