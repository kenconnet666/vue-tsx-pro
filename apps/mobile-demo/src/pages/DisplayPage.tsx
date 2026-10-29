// 展示：通知栏、宫格、步骤条、折叠面板、空状态；三端同一份页面
import {
  Box,
  CreditCard,
  Gift,
  Headphones,
  MapPin,
  MessageSquare,
  Package,
  RotateCcw,
  Star,
  Ticket,
  Truck,
  Wallet,
} from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  CellGroup,
  Collapse,
  CollapseItem,
  ConfigProvider,
  Empty,
  Grid,
  GridItem,
  NoticeBar,
  Steps,
  showToast,
  type IconData,
} from '@zerodep-dev/vue-tsx-pro-mobile';
import { demoSettings } from '../settings.ts';

const styles = css.create({
  page: { minHeight: '100vh', paddingBlockEnd: '_xxl', backgroundColor: '_background' },
  gap: { height: '0.5em' },
});

/** 宫格的一格 */
interface Entry {
  icon: IconData;
  text: string;
  badge?: number | boolean;
}

const ORDERS: Entry[] = [
  { icon: Wallet, text: '待付款', badge: 2 },
  { icon: Package, text: '待发货' },
  { icon: Truck, text: '待收货', badge: 1 },
  { icon: MessageSquare, text: '待评价', badge: true },
  { icon: RotateCcw, text: '退款/售后' },
];

const SERVICES: Entry[] = [
  { icon: Ticket, text: '优惠券' },
  { icon: Gift, text: '积分商城' },
  { icon: CreditCard, text: '银行卡' },
  { icon: MapPin, text: '收货地址' },
  { icon: Star, text: '收藏' },
  { icon: Headphones, text: '客服' },
  { icon: Box, text: '寄快递' },
];

const LOGISTICS = [
  { title: '已签收，签收人：本人', description: '10-30 09:12 · 上海市浦东新区' },
  { title: '派送中，快递员：王师傅 138****0000', description: '10-30 07:40' },
  { title: '到达上海转运中心', description: '10-29 22:15' },
  { title: '已发货', description: '10-29 10:03 · 杭州仓' },
];

export const DisplayPage = _component(() => {
  let faq = _state<string[] | string | null>(['ship']);
  let single = _state<string[] | string | null>(null);
  let loaded = _state(false);

  return () => (
    <ConfigProvider theme={demoSettings.theme} {...css.attrs(styles.page)}>
      <NoticeBar>
        双十一活动 11 月 1 日开始，全场满 300 减 50，会员再享 95 折，部分商品限量，先到先得
      </NoticeBar>
      <div {...css.attrs(styles.gap)} />
      <NoticeBar mode="closeable" tone="danger">
        账户存在风险，请尽快完善实名信息
      </NoticeBar>
      <div {...css.attrs(styles.gap)} />
      <NoticeBar mode="link" tone="accent" onClick={() => showToast('查看公告详情')}>
        新版本上线：支持暗色主题
      </NoticeBar>

      <CellGroup title="我的订单">
        <Grid columns={5}>
          {ORDERS.map((item) => (
            <GridItem {...item} onClick={() => showToast(item.text)} />
          ))}
        </Grid>
      </CellGroup>

      <CellGroup title="常用服务（正方形、无细线）">
        <Grid columns={4} square border={false}>
          {SERVICES.map((item) => (
            <GridItem {...item} onClick={() => showToast(item.text)} />
          ))}
        </Grid>
      </CellGroup>

      <CellGroup title="订单进度">
        <Steps
          active={2}
          items={[{ title: '下单' }, { title: '付款' }, { title: '发货' }, { title: '收货' }]}
        />
      </CellGroup>
      <CellGroup title="物流详情">
        <Steps direction="vertical" active={0} items={LOGISTICS} />
      </CellGroup>

      <CellGroup title="常见问题">
        <Collapse _value={faq}>
          <CollapseItem name="ship" title="多久发货？">
            付款后 48 小时内发货，预售商品以商品页标注的时间为准。
          </CollapseItem>
          <CollapseItem name="refund" title="怎么申请退款？" value="7 天无理由">
            在“我的订单”里找到订单，点“申请售后”，按提示填写原因并上传照片。
          </CollapseItem>
          <CollapseItem name="invoice" title="可以开发票吗？" disabled>
            暂不支持
          </CollapseItem>
        </Collapse>
      </CellGroup>
      <CellGroup title="手风琴（同时只展开一个）">
        <Collapse _value={single} accordion>
          <CollapseItem name="a" title="会员等级">
            消费满 1000 元升级为银卡会员。
          </CollapseItem>
          <CollapseItem name="b" title="积分规则">
            每消费 1 元得 1 积分，积分可抵现。
          </CollapseItem>
        </Collapse>
      </CellGroup>

      <CellGroup title="空状态">
        {loaded ? (
          <Empty preset="search" description="没有找到相关商品" />
        ) : (
          <Empty preset="network" description="网络不太好，加载失败">
            <Button size="sm" radius="full" onClick={() => (loaded = true)}>
              重新加载
            </Button>
          </Empty>
        )}
      </CellGroup>
    </ConfigProvider>
  );
});
