/**
 * 整页模板共用的演示数据：采购单、供应商、状态。数字固定（不随时间、不随机），服务端渲染与浏览器一致。
 */
import { createStatusMap } from '@zerodep-dev/vue-tsx-pro-ui';

/** 一张采购单 */
export interface PurchaseOrder {
  id: string;
  supplier: string;
  category: string;
  buyer: string;
  status: 'draft' | 'approving' | 'ordered' | 'received';
  amount: number;
  orderedAt: string;
}

export const statuses = createStatusMap({
  draft: { label: '草稿', tone: 'neutral' },
  approving: { label: '审批中', tone: 'warning' },
  ordered: { label: '已下单', tone: 'info' },
  received: { label: '已到货', tone: 'success' },
});

export const suppliers = ['华辰精密', '启航塑胶', '远山钣金', '恒通紧固件', '北辰电子', '青禾线缆'];
export const categories = ['机械件', '塑料件', '钣金件', '标准件', '线缆'];
export const buyers = ['林小满', '周一航', '陈默', '许悠', '王晴', '赵浩然'];

/** 128 张采购单：日期从 2026-10-21 往前排 */
export const orders: PurchaseOrder[] = Array.from({ length: 128 }, (_, index) => ({
  id: `PO-2026-${String(2000 + index)}`,
  supplier: suppliers[(index * 5) % suppliers.length]!,
  category: categories[(index * 7) % categories.length]!,
  buyer: buyers[(index * 11) % buyers.length]!,
  status: statuses.keys[(index * 3) % statuses.keys.length]!,
  amount: ((index * 7919) % 90_000) + 1200,
  orderedAt: new Date(Date.UTC(2026, 9, 21) - ((index * 13) % 90) * 86_400_000)
    .toISOString()
    .slice(0, 10),
}));
