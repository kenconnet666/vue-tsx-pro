/**
 * 指南：主题定制。左栏先选一套内置主题作起点、再用编辑器微调（宽屏时粘在顶栏下面，自己滚动），
 * 右栏是一个小型应用页面的预览；调整立即作用在整个站点上
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { breakpoints } from '@vue-tsx-pro/ui/tokens';
import { Code, H2, ScrollArea } from '@vue-tsx-pro/ui';
import { ThemeCustomizer } from '@vue-tsx-pro/ui/theme-customize';
import CustomBrand from '../demo/CustomBrand.tsx?demo';
import FollowSystem from '../demo/FollowSystem.tsx?demo';
import RuntimeSwitch from '../demo/RuntimeSwitch.tsx?demo';
import ThemeGallery from '../demo/ThemeGallery.tsx?demo';
import { DocPage } from '../../site/DocPage';
import { Example } from '../../site/Example';
import { preference, themeSettings } from '../../site/theme';
import { Preview } from './theming/Preview';
import { StartingPoint } from './theming/StartingPoint';

const meta = {
  title: 'Theming 主题定制',
  description:
    '十二套内置主题，局部主题、跟随系统、运行时切换与自定义品牌色的用法；选一套主题作起点，再调品牌色、中性色、圆角、缩放、字体与动效，改动立即作用在整个站点上，满意后复制或下载代码。',
};

const styles = css.create({
  // 宽屏时控制栏在左、预览在右；窄屏上下排
  layout: {
    display: 'grid',
    gap: '2rem',
    alignItems: 'start',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [breakpoints.lg]: 'minmax(18rem, 22rem) minmax(0, 1fr)',
    },
  },
  // 控制栏粘在顶栏下面，比视口高时自己滚动，预览一直在旁边
  controls: {
    position: { default: 'static', [breakpoints.lg]: 'sticky' },
    // 顶栏高度（AppShell 的 HEADER_HEIGHT）+ 间距
    top: 'calc(3rem + 1rem)',
    maxHeight: { default: 'none', [breakpoints.lg]: 'calc(100dvh - 3rem - 2rem)' },
  },
  controlsInner: { display: 'flex', flexDirection: 'column', gap: '_xl', paddingInlineEnd: '_md' },
  // 预览是界面，不是长文：字号与行高回到组件的默认值
  preview: { fontSize: '_md', lineHeight: '_normal', minWidth: 0 },
});

export default _component(() => () => (
  <DocPage wide meta={meta}>
    <H2 id="customize" size="xl" anchor>
      调整
    </H2>
    <div {...css.attrs(styles.layout)}>
      <ScrollArea sx={styles.controls} propsViewport={{ 'aria-label': '主题调整' }}>
        <div {...css.attrs(styles.controlsInner)}>
          <StartingPoint />
          <ThemeCustomizer settings={_bind(themeSettings.value)} base={preference.theme} />
        </div>
      </ScrollArea>
      <div {...css.attrs(styles.preview)}>
        <Preview />
      </div>
    </div>
    <Example id="builtin" title="内置主题" demo={ThemeGallery}>
      十二套内置主题都在 <Code>builtinThemes</Code>{' '}
      里：亮色（默认）、暗色、纸张（米黄纸色与衬线标题）、午夜（深海军蓝与青色）、高对比（文字到
      7:1）、海洋（天空蓝与深海蓝）、森林（叶绿与林木绿）、柠檬（奶油黄与柠檬黄）、樱花（淡粉）、喜庆（中国红与金色）、赛博朋克（深紫黑与霓虹）、咖啡（浓缩咖啡与焦糖）。每套都通过对比度检查；示例里每张卡片套一层{' '}
      <Code>Provider</Code>
      ，主题只作用在这一块，这就是局部主题的写法。
    </Example>
    <Example id="follow-system" title="跟随系统" demo={FollowSystem}>
      <Code>theme</Code> 写成 <Code>{'{ light, dark }'}</Code> 两套，按系统的明暗选一套；
      <Code>createUi</Code> 与 <Code>Provider</Code>{' '}
      都接受这种写法。左边一张跟随系统，右边两张是系统亮、暗时它的样子。
    </Example>
    <Example id="switch" title="运行时切换" demo={RuntimeSwitch}>
      <Code>createThemePreference</Code> 记住用户的选择（某一套主题或跟随系统），
      <Code>ThemeSwitcher</Code> 是顶栏里一个按钮的紧凑写法，设置页可以用{' '}
      <Code>ThemeThumbnail</Code> 与 <Code>builtinThemeLabel</Code>{' '}
      列出每套主题的缩略图与名字。页面首次加载不闪默认主题：把 <Code>themeBootScript</Code>{' '}
      生成的脚本内联到 HTML 的 head 里。
    </Example>
    <Example id="brand" title="自定义品牌色与圆角" demo={CustomBrand}>
      <Code>defineTheme</Code> 在已有主题上改 token，<Code>paletteColors</Code> 按 Radix
      色阶整组换品牌色与中性色；
      <Code>customizeTheme</Code>{' '}
      是上面主题编辑器的旋钮，品牌色、中性色、圆角、缩放、字体、动效一次给出。它们要用颜色库，在子路径{' '}
      <Code>@vue-tsx-pro/ui/theme-customize</Code>：本站只在访客改过主题设置时才加载。
    </Example>
  </DocPage>
));
