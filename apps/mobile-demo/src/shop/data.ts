// 演示商城的数据：按编号算出来的商品（不联网），分页接口模拟网络延迟；图片用按色相生成的色块代替
export interface Product {
  id: number;
  name: string;
  price: number;
  sales: number;
  /** 图片色块的色相 */
  hue: number;
  tags: string[];
}

const NAMES = [
  '冷萃咖啡',
  '桂花乌龙',
  '燕麦拿铁',
  '手冲豆',
  '冻干咖啡粉',
  '抹茶粉',
  '挂耳礼盒',
  '陶瓷马克杯',
];
const TAGS = [['包邮'], ['新品', '包邮'], ['限时折扣'], [], ['会员价']];

/** 第 id 个商品 */
export function getProduct(id: number): Product {
  return {
    id,
    name: `${NAMES[id % NAMES.length]} · ${id + 1} 号`,
    price: Math.round(((id * 37) % 180) + 19.9) - 0.1,
    sales: (id * 131) % 5000,
    hue: (id * 47) % 360,
    tags: TAGS[id % TAGS.length]!,
  };
}

/** 每页几个 */
export const PAGE_SIZE = 8;
/** 一共几页 */
export const PAGE_COUNT = 4;

/** 取一页商品（页码从 0 开始），延迟模拟网络；fail 为 true 时这一次失败 */
export async function fetchProducts(page: number, fail = false): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (fail) throw new Error('网络错误');
  return Array.from({ length: PAGE_SIZE }, (_, index) => getProduct(page * PAGE_SIZE + index));
}

/** 色块图片的背景 */
export const swatch = (hue: number) =>
  `linear-gradient(135deg, hsl(${hue} 70% 72%), hsl(${(hue + 40) % 360} 65% 55%))`;
