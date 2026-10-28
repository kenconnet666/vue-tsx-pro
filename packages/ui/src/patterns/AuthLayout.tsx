/**
 * 登录、注册、找回密码这类认证页的整页版式：宽屏时左边是品牌区（hero）、右边是表单，窄屏时品牌区收成顶部一块、表单紧跟其后。
 *
 *   <AuthLayout hero={<LoginHero />} tools={<ThemeSwitcher preference={preference} />}>
 *     <Card>…登录表单…</Card>
 *   </AuthLayout>
 *
 * hero 是品牌区的内容（标志、口号、背景动画），铺满它那一半；不写 hero 时表单居中，不分栏。tools 放在表单这一半的结束边上角
 * （主题切换、语言切换）。表单区把 children 垂直居中（宽屏）或贴近顶部（窄屏，登录卡片不被品牌区挤到第二屏）。
 * 分栏的断点是 sizes.lg（64rem），与 AppShell 一致。
 *
 * 部件：Root（div）、Hero（div）、Main（main）、Tools（div）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { breakpoints } from '../config/theme/tokens';
import { hasContent, mergeAttrs, type PartProps } from '../utils/props';

/** 未声明的属性落到外层 div 上 */
export interface AuthLayoutProps extends PartProps<'div'> {
  /** 品牌区：宽屏在左半边，窄屏在顶部；不写时不分栏 */
  hero?: VNodeChild;
  /** 表单这一半结束边上角的工具（主题切换、语言切换） */
  tools?: VNodeChild;
  /** 品牌区（div）的部件属性 */
  propsHero?: PartProps<'div'>;
  /** 表单区（main）的部件属性 */
  propsMain?: PartProps<'main'>;
  /** 工具区（div）的部件属性 */
  propsTools?: PartProps<'div'>;
  /** 表单 */
  children?: VNodeChild;
}

/** AuthLayout 的样式：root、split、hero、main、tools */
export const authLayoutStyles = css.create({
  root: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridTemplateRows: 'minmax(0, 1fr)',
    minHeight: '100dvh',
    backgroundColor: '_background',
    color: '_text',
  },
  // 有品牌区：窄屏上下两行（品牌区按内容高、表单占剩下的），宽屏左右两栏
  split: {
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [breakpoints.lg]: 'minmax(0, 1.15fr) minmax(0, 1fr)',
    },
    gridTemplateRows: { default: 'auto minmax(0, 1fr)', [breakpoints.lg]: 'minmax(0, 1fr)' },
  },
  hero: { minHeight: { default: 'auto', [breakpoints.lg]: '100dvh' } },
  main: {
    position: 'relative',
    display: 'flex',
    alignItems: { default: 'flex-start', [breakpoints.lg]: 'center' },
    justifyContent: 'center',
    boxSizing: 'border-box',
    padding: '_lg',
    paddingTop: { default: '_xl', [breakpoints.lg]: '_lg' },
  },
  tools: { position: 'absolute', top: '_md', insetInlineEnd: '_md', zIndex: 1 },
});

/** 认证页的整页版式：左边品牌区、右边表单；窄屏品牌区收成顶部一块 */
export const AuthLayout = _component(
  ({ hero, tools, propsHero, propsMain, propsTools, children, ...rest }: AuthLayoutProps) =>
    () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [authLayoutStyles.root, hasContent(hero) && authLayoutStyles.split] },
          rest,
        )}
      >
        {hasContent(hero) && (
          <div {...mergeAttrs<'div'>({ sx: authLayoutStyles.hero }, propsHero)}>{hero}</div>
        )}
        <main {...mergeAttrs<'main'>({ sx: authLayoutStyles.main }, propsMain)}>
          {hasContent(tools) && (
            <div {...mergeAttrs<'div'>({ sx: authLayoutStyles.tools }, propsTools)}>{tools}</div>
          )}
          {children}
        </main>
      </div>
    ),
);
