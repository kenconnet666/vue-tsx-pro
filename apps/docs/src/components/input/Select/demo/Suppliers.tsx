// 远程搜索加分页：load 的第三个参数是第几页，返回 { items, next }；滚到列表末尾时取下一页，骨架接在已有的选项后面
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Field, Select, Small, type InfinitePage } from '@zerodep-dev/vue-tsx-pro-ui';

interface Supplier {
  code: string;
  name: string;
}

const cities = ['苏州', '宁波', '东莞', '成都', '西安', '沈阳', '青岛', '无锡'];
const marks = ['恒', '华', '瑞', '鑫', '永'];
const trades = ['精工', '液压', '紧固件', '电子', '包装', '模具', '轴承', '铸造'];
const suppliers: Supplier[] = cities.flatMap((city, c) =>
  marks.flatMap((mark, m) =>
    trades.map((trade, t) => ({
      code: `S${String(c * 40 + m * 8 + t + 1).padStart(4, '0')}`,
      name: `${city}${mark}${trade}有限公司`,
    })),
  ),
);

const PAGE = 20;

/** 假的供应商接口：按名称或编码搜索，每页 20 条，500 ms 后返回；被顶掉、关掉弹层时中止 */
const fetchSuppliers = (query: string, signal: AbortSignal, page: number) =>
  new Promise<InfinitePage<Supplier, number>>((resolve, reject) => {
    const timer = setTimeout(() => {
      const keyword = query.trim().toUpperCase();
      const matched = suppliers.filter(
        (supplier) => supplier.name.includes(keyword) || supplier.code.includes(keyword),
      );
      resolve({
        items: matched.slice((page - 1) * PAGE, page * PAGE),
        next: page * PAGE < matched.length ? page + 1 : undefined,
      });
    }, 500);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

export default _component(() => {
  let picked = _state<string | null>(null);
  return () => (
    <Field label="供应商" description={`共 ${suppliers.length} 家，每次取 ${PAGE} 家`}>
      <Select
        load={fetchSuppliers}
        searchable
        toOption={(supplier) => ({ value: supplier.code, label: supplier.name })}
        _value={picked}
        clearable
        placeholder="搜索名称或编码"
      >
        {(supplier) => (
          <>
            {supplier.name}{' '}
            <Small tone="muted" mono>
              {supplier.code}
            </Small>
          </>
        )}
      </Select>
    </Field>
  );
});
