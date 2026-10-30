// 真实场景之二：商品详情——多图轮播、价格与标签、选规格（动作面板）、数量、详情与售后（折叠面板）、底部操作栏，立即购买进确认订单
import { Headphones, ShoppingCart } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  ActionSheet,
  Badge,
  Button,
  Cell,
  CellGroup,
  Collapse,
  CollapseItem,
  ConfigProvider,
  Icon,
  Stepper,
  Swiper,
  SwiperItem,
  Tag,
  showSuccessToast,
  showToast,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { go } from '../nav.ts';
import { demoSettings } from '../settings.ts';
import { getProduct, swatch } from '../shop/data.ts';

const styles = css.create({
  page: {
    minHeight: '100vh',
    // 给底部的操作栏让出位置
    paddingBlockEnd: 'calc(4em + env(safe-area-inset-bottom))',
    backgroundColor: '_background',
  },
  image: { height: '100%' },
  summary: { padding: '_lg', backgroundColor: '_surface' },
  price: { color: '_dangerText', fontSize: '_xxl', fontWeight: '_bold' },
  name: { marginBlock: '0.4em', fontSize: '_lg', fontWeight: '_semibold', color: '_text' },
  tags: { display: 'flex', gap: '0.3em' },
  detail: { lineHeight: '1.7' },
  bar: {
    boxSizing: 'content-box',
    position: 'fixed',
    insetInline: 0,
    insetBlockEnd: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    height: '3.6em',
    paddingInline: '_md',
    paddingBlockEnd: 'env(safe-area-inset-bottom)',
    backgroundColor: '_surface',
    borderBlockStartWidth: '_hairline',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_border',
  },
  icon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.15em',
    minWidth: '3em',
    fontSize: '_xs',
    color: '_textMuted',
    cursor: 'pointer',
  },
  iconGlyph: { fontSize: '1.6em' },
  actions: { flex: '1 1 auto', display: 'flex', gap: '_sm' },
  action: { flex: '1 1 0' },
});

const SPECS = ['250 克 · 中度烘焙', '500 克 · 中度烘焙', '250 克 · 深度烘焙'];

export const ProductPage = _component(({ query = {} }: { query?: Record<string, string> }) => {
  const product = _derived(getProduct(Number(query.id ?? 0)));
  let spec = _state(SPECS[0]!);
  let picking = _state(false);
  let count = _state(1);
  let cart = _state(3);

  return () => (
    <ConfigProvider theme={demoSettings.theme} {...css.attrs(styles.page)}>
      <Swiper height="20em">
        {[0, 60, 120].map((shift) => (
          <SwiperItem>
            <div {...css.attrs(styles.image)} style={{ background: swatch(product.hue + shift) }} />
          </SwiperItem>
        ))}
      </Swiper>
      <div {...css.attrs(styles.summary)}>
        <div {...css.attrs(styles.price)}>¥{product.price.toFixed(1)}</div>
        <div {...css.attrs(styles.name)}>{product.name}</div>
        <div {...css.attrs(styles.tags)}>
          {product.tags.map((tag) => (
            <Tag tone="danger" variant="soft" size="sm">
              {tag}
            </Tag>
          ))}
          <Tag variant="outline" tone="neutral" size="sm">
            已售 {product.sales}
          </Tag>
        </div>
      </div>
      <CellGroup>
        <Cell title="规格" value={spec} arrow onClick={() => (picking = true)} />
        <Cell title="数量" center value={<Stepper _value={count} max={10} />} />
        <Cell title="配送" value="上海 · 预计明天送达" />
      </CellGroup>
      <CellGroup title="商品信息">
        <Collapse _value={['detail']}>
          <CollapseItem name="detail" title="详情">
            <div {...css.attrs(styles.detail)}>
              产地：埃塞俄比亚 · 耶加雪菲。风味：柑橘、茉莉花、红茶。冲煮建议：水温 92°C，粉水比
              1:15。
            </div>
          </CollapseItem>
          <CollapseItem name="after" title="售后" value="7 天无理由">
            未拆封商品 7 天内可无理由退货，拆封后如有质量问题可换货。
          </CollapseItem>
        </Collapse>
      </CellGroup>

      <div {...css.attrs(styles.bar)}>
        <span {...css.attrs(styles.icon)} role="button" onClick={() => showToast('客服')}>
          <Icon icon={Headphones} sx={styles.iconGlyph} />
          客服
        </span>
        <span
          {...css.attrs(styles.icon)}
          role="button"
          onClick={() => showToast(`购物车里有 ${cart} 件`)}
        >
          <Badge content={cart}>
            <Icon icon={ShoppingCart} sx={styles.iconGlyph} />
          </Badge>
          购物车
        </span>
        <span {...css.attrs(styles.actions)}>
          <Button
            variant="soft"
            radius="full"
            sx={styles.action}
            onClick={() => {
              cart += count;
              showSuccessToast('已加入购物车');
            }}
          >
            加入购物车
          </Button>
          <Button
            radius="full"
            sx={styles.action}
            onClick={() => go('checkout', { id: product.id, count, spec })}
          >
            立即购买
          </Button>
        </span>
      </div>
      <ActionSheet
        _open={picking}
        title="选择规格"
        actions={SPECS.map((name) => ({ name, tone: name === spec ? 'accent' : undefined }))}
        onSelect={(_, index) => (spec = SPECS[index]!)}
      />
    </ConfigProvider>
  );
});
