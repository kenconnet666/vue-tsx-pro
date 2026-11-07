/**
 * 采购单的接口：这里是内存里的假数据（有延迟，能取消），换成真的接口时保留函数签名，
 * 用组件库的 http（createUi({ http })）或自己的请求库实现即可
 */
import { z } from 'zod';
import type { TablePage, TableQuery } from '@zerodep-dev/vue-tsx-pro-ui';

/** 采购单的表单：校验、类型、界面（SchemaForm 按它生成）都从这一份来 */
export const orderSchema = z.object({
  supplier: z.string().min(2, '请填写供应商').meta({ title: '供应商' }),
  category: z
    .enum(['机械件', '塑料件', '钣金件', '标准件'], '请选择品类')
    .meta({ title: '品类', placeholder: '请选择' }),
  amount: z.number('请填写金额').min(1).meta({ title: '金额', unit: '元' }),
  delivery: z.iso.date('请选择交货日期').meta({ title: '交货日期' }),
  note: z.string().max(200).meta({ title: '备注', control: 'textarea', span: 'full' }),
});

export type OrderInput = z.input<typeof orderSchema>;

export interface Order extends z.output<typeof orderSchema> {
  id: string;
  status: 'draft' | 'approving' | 'ordered';
}

/** 列表的筛选条件 */
export interface OrderFilters {
  keyword: string;
  status: string | null;
}

const orders: Order[] = Array.from({ length: 42 }, (_, index) => ({
  id: `PO-${String(1001 + index)}`,
  supplier: ['华辰精密', '启航塑胶', '远山钣金', '恒通紧固件'][index % 4]!,
  category: (['机械件', '塑料件', '钣金件', '标准件'] as const)[index % 4]!,
  amount: ((index * 7919) % 90_000) + 1200,
  delivery: `2026-12-${String((index % 28) + 1).padStart(2, '0')}`,
  note: '',
  status: (['draft', 'approving', 'ordered'] as const)[index % 3]!,
}));

/** 等一会儿再给结果，取消时不给 */
function later<T>(make: () => T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(make()), 300);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

/** 列表：按关键字、状态筛，按列排序，分页 */
export function listOrders(
  query: TableQuery<OrderFilters, undefined>,
  signal: AbortSignal,
): Promise<TablePage<Order>> {
  return later(() => {
    const { keyword, status } = query.filters;
    const matched = orders.filter(
      (order) =>
        (!keyword || order.id.includes(keyword) || order.supplier.includes(keyword)) &&
        (!status || order.status === status),
    );
    const sort = query.sorts[0];
    if (sort) {
      const key = sort.key as keyof Order;
      matched.sort((a, b) => {
        const order = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
        return sort.direction === 'ascending' ? order : -order;
      });
    }
    const start = (query.page - 1) * query.pageSize;
    return { rows: matched.slice(start, start + query.pageSize), total: matched.length };
  }, signal);
}

/** 一张采购单；没有时是 null */
export const getOrder = (id: string) =>
  later(() => orders.find((order) => order.id === id) ?? null);

/** 保存（新建或修改），返回保存后的采购单 */
export function saveOrder(id: string | null, input: z.output<typeof orderSchema>): Promise<Order> {
  return later(() => {
    const existing = id ? orders.find((order) => order.id === id) : undefined;
    if (existing) return Object.assign(existing, input);
    const created: Order = { ...input, id: `PO-${String(1001 + orders.length)}`, status: 'draft' };
    orders.unshift(created);
    return created;
  });
}
