// 演示页：页面名 → 组件，第一个是首页。小程序入口（app.ts）与 H5 入口（main.ts）共用
import { BasicsPage } from './BasicsPage.tsx';
import { FeedbackPage } from './FeedbackPage.tsx';
import { DisplayPage } from './DisplayPage.tsx';
import { FormPage } from './FormPage.tsx';
import { NavigationPage } from './NavigationPage.tsx';
import { ShopPage } from './ShopPage.tsx';
import { ProductPage } from './ProductPage.tsx';
import { CheckoutPage } from './CheckoutPage.tsx';
import { CitiesPage } from './CitiesPage.tsx';
import { PickersPage } from './PickersPage.tsx';
import { CapabilitiesPage } from './CapabilitiesPage.tsx';

export const DEMO_PAGES = {
  index: BasicsPage,
  feedback: FeedbackPage,
  form: FormPage,
  display: DisplayPage,
  navigation: NavigationPage,
  shop: ShopPage,
  product: ProductPage,
  checkout: CheckoutPage,
  cities: CitiesPage,
  pickers: PickersPage,
  capabilities: CapabilitiesPage,
};

/** 演示页的名字 */
export type DemoPage = keyof typeof DEMO_PAGES;

/** 页面标题：原生应用顶上的导航栏用（小程序的标题在 app.json，H5 在浏览器的标签上） */
export const DEMO_TITLES: Record<DemoPage, string> = {
  index: 'vue-tsx-pro',
  feedback: '浮层与反馈',
  form: '表单',
  display: '展示',
  navigation: '导航',
  shop: '商城',
  product: '商品详情',
  checkout: '确认订单',
  cities: '城市列表',
  pickers: '选择',
  capabilities: '能力与权限',
};
