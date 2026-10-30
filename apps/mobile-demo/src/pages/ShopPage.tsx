// 真实场景之一：商城首页——搜索、轮播、分类宫格、触底加载的商品列表（第二次加载故意失败一次，演示重试），点商品进详情
import { Coffee, CupSoda, Gift, Leaf, Package } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  ConfigProvider,
  Grid,
  GridItem,
  List,
  Search,
  Sticky,
  Swiper,
  SwiperItem,
  Tag,
  showToast,
  type IconData,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { go } from '../nav.ts';
import { demoSettings } from '../settings.ts';
import { fetchProducts, PAGE_COUNT, swatch, type Product } from '../shop/data.ts';

const styles = css.create({
  page: { minHeight: '100vh', backgroundColor: '_background' },
  banner: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
    paddingInline: '1.5em',
    color: '#fff',
    fontSize: '_lg',
    fontWeight: '_semibold',
  },
  bannerSub: { marginBlockStart: '0.3em', fontSize: '_sm', fontWeight: '_normal', opacity: 0.9 },
  swiper: { marginBlock: '_md', marginInline: '_md', borderRadius: '_lg', overflow: 'hidden' },
  card: {
    display: 'flex',
    gap: '_md',
    marginInline: '_md',
    marginBlockEnd: '_sm',
    padding: '_md',
    borderRadius: '_lg',
    backgroundColor: { default: '_surface', ':active': '_fillActive' },
    cursor: 'pointer',
  },
  image: { flex: 'none', width: '5.5em', height: '5.5em', borderRadius: '_md' },
  body: { flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35em' },
  name: { fontSize: '_md', fontWeight: '_medium', color: '_text' },
  tags: { display: 'flex', gap: '0.3em' },
  bottom: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBlockStart: 'auto',
  },
  price: { color: '_dangerText', fontSize: '_lg', fontWeight: '_semibold' },
  sales: { fontSize: '_xs', color: '_textMuted' },
});

const CATEGORIES: { icon: IconData; text: string }[] = [
  { icon: Coffee, text: '咖啡' },
  { icon: Leaf, text: '茶饮' },
  { icon: CupSoda, text: '冷饮' },
  { icon: Package, text: '咖啡豆' },
  { icon: Gift, text: '礼盒' },
];

const BANNERS = [
  { hue: 20, title: '秋季新品', sub: '桂花乌龙 · 第二杯半价' },
  { hue: 200, title: '会员日', sub: '全场 9 折，满 99 包邮' },
  { hue: 280, title: '咖啡豆上新', sub: '埃塞俄比亚 · 耶加雪菲' },
];

export const ShopPage = _component(() => {
  let keyword = _state('');
  let products = _state.raw<Product[]>([]);
  let page = 0;
  let finished = _state(false);
  let failedOnce = false;

  const load = async () => {
    // 第二页第一次加载故意失败：演示“加载失败，点击重试”
    const fail = page === 1 && !failedOnce;
    if (fail) failedOnce = true;
    const rows = await fetchProducts(page, fail);
    products = [...products, ...rows];
    page++;
    finished = page >= PAGE_COUNT;
  };

  return () => (
    <ConfigProvider theme={demoSettings.theme} {...css.attrs(styles.page)}>
      <Sticky>
        <Search
          _value={keyword}
          placeholder="搜索咖啡、茶饮"
          onSearch={(text) => showToast(`搜索：${text}`)}
        />
      </Sticky>
      <Swiper autoplay={3000} height="8.5em" {...css.attrs(styles.swiper)}>
        {BANNERS.map((banner) => (
          <SwiperItem>
            <div {...css.attrs(styles.banner)} style={{ background: swatch(banner.hue) }}>
              {banner.title}
              <span {...css.attrs(styles.bannerSub)}>{banner.sub}</span>
            </div>
          </SwiperItem>
        ))}
      </Swiper>
      <Grid columns={5} border={false}>
        {CATEGORIES.map((item) => (
          <GridItem {...item} onClick={() => showToast(item.text)} />
        ))}
      </Grid>
      <List finished={finished} onLoad={load}>
        {products.map((product) => (
          <div
            {...css.attrs(styles.card)}
            role="button"
            onClick={() => go('product', { id: product.id })}
          >
            <div {...css.attrs(styles.image)} style={{ background: swatch(product.hue) }} />
            <div {...css.attrs(styles.body)}>
              <span {...css.attrs(styles.name)}>{product.name}</span>
              <span {...css.attrs(styles.tags)}>
                {product.tags.map((tag) => (
                  <Tag size="sm" tone="danger" variant="soft">
                    {tag}
                  </Tag>
                ))}
              </span>
              <span {...css.attrs(styles.bottom)}>
                <span {...css.attrs(styles.price)}>¥{product.price.toFixed(1)}</span>
                <span {...css.attrs(styles.sales)}>已售 {product.sales}</span>
              </span>
            </div>
          </div>
        ))}
      </List>
    </ConfigProvider>
  );
});
