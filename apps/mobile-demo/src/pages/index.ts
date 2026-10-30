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
};

/** 演示页的名字 */
export type DemoPage = keyof typeof DEMO_PAGES;
