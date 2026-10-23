/** 主题编辑器（ThemeCustomizer）自带的文案：不在 Lang 里，新增一种语言不必翻（见 config/lang/messages.ts） */
import type { MessageTable } from '../config/lang/messages';
import type { AccentScale, NeutralScale } from './palette';

/** ThemeCustomizer 的文案 */
export interface ThemeCustomizerMessages {
  /** 品牌色一组的标题，默认“品牌色” */
  readonly accent: string;
  /** 中性色一组的标题，默认“中性色” */
  readonly neutral: string;
  /** 沿用主题本来的颜色，默认“主题默认” */
  readonly themeDefault: string;
  /** 品牌色、中性色色阶的名字（主题编辑器的色块），如 indigo → “靛蓝” */
  readonly colorNames: Readonly<Record<AccentScale | NeutralScale, string>>;
  /** 圆角一组的标题，默认“圆角” */
  readonly radius: string;
  /** 圆角选项，默认“直角” */
  readonly radiusNone: string;
  /** 圆角选项，默认“小” */
  readonly radiusSmall: string;
  /** 圆角选项，默认“中” */
  readonly radiusMedium: string;
  /** 圆角选项，默认“大” */
  readonly radiusLarge: string;
  /** 缩放一组的标题，默认“缩放” */
  readonly scaling: string;
  /** 字体一组的标题，默认“字体” */
  readonly font: string;
  /** 字体选项，默认“无衬线” */
  readonly fontSans: string;
  /** 字体选项，默认“衬线标题” */
  readonly fontSerifHeadings: string;
  /** 动效一组的标题，默认“动效” */
  readonly motion: string;
  /** 动效选项，默认“关闭” */
  readonly motionNone: string;
  /** 动效选项，默认“快” */
  readonly motionFast: string;
  /** 动效选项，默认“正常” */
  readonly motionNormal: string;
  /** 动效选项，默认“慢” */
  readonly motionSlow: string;
  /** 对比度检查一组的标题，默认“对比度” */
  readonly contrast: string;
  /** 配色全部达到对比度要求时的提示；count 是检查了多少组颜色 */
  readonly contrastOk: (count: number) => string;
  /** 一处对比度不够：前景 / 背景 token、实际与要求的对比度 */
  readonly contrastIssue: (pair: string, ratio: string, minimum: number) => string;
  /** 导出代码一组的标题，默认“代码” */
  readonly code: string;
  /** 恢复默认设置的按钮，默认“恢复默认” */
  readonly reset: string;
  /** 把导出代码存成文件的按钮，默认“下载” */
  readonly download: string;
  /** 把当前主题存成设计令牌（Figma 变量能导入的 JSON）的按钮，默认“下载 Figma 变量” */
  readonly downloadTokens: string;
  /** 颜色分组的标题，默认“颜色” */
  readonly groupColor: string;
  /** 颜色分组的说明 */
  readonly groupColorHint: string;
  /** 形状与尺寸分组的标题，默认“形状与尺寸” */
  readonly groupShape: string;
  /** 形状与尺寸分组的说明 */
  readonly groupShapeHint: string;
  /** 字体与动效分组的标题，默认“字体与动效” */
  readonly groupType: string;
  /** 字体与动效分组的说明 */
  readonly groupTypeHint: string;
  /** 检查与导出分组的标题，默认“检查与导出” */
  readonly groupExport: string;
  /** 检查与导出分组的说明 */
  readonly groupExportHint: string;
}

/** ThemeCustomizer 的文案表 */
export const themeCustomizerMessages: MessageTable<ThemeCustomizerMessages> = {
  'zh-CN': {
    accent: '品牌色',
    neutral: '中性色',
    themeDefault: '主题默认',
    colorNames: {
      tomato: '番茄红',
      red: '红',
      ruby: '宝石红',
      crimson: '绯红',
      pink: '粉',
      plum: '梅紫',
      purple: '紫',
      violet: '紫罗兰',
      iris: '鸢尾蓝',
      indigo: '靛蓝',
      blue: '蓝',
      sky: '天蓝',
      cyan: '青',
      teal: '水鸭蓝',
      jade: '翡翠绿',
      mint: '薄荷绿',
      green: '绿',
      grass: '草绿',
      lime: '青柠',
      yellow: '黄',
      amber: '琥珀',
      orange: '橙',
      brown: '棕',
      bronze: '青铜',
      gold: '金',
      slate: '岩灰',
      gray: '灰',
      mauve: '藕灰',
      sage: '鼠尾草灰',
      olive: '橄榄灰',
      sand: '沙灰',
    },
    radius: '圆角',
    radiusNone: '直角',
    radiusSmall: '小',
    radiusMedium: '中',
    radiusLarge: '大',
    scaling: '缩放',
    font: '字体',
    fontSans: '无衬线',
    fontSerifHeadings: '衬线标题',
    motion: '动效',
    motionNone: '关闭',
    motionFast: '快',
    motionNormal: '正常',
    motionSlow: '慢',
    contrast: '对比度',
    contrastOk: (count) => `${count} 组文字与界面部件的颜色都达到 WCAG AA`,
    contrastIssue: (pair, ratio, minimum) => `${pair}：${ratio}，要求 ${minimum}`,
    code: '代码',
    reset: '恢复默认',
    download: '下载',
    downloadTokens: '下载 Figma 变量',
    groupColor: '颜色',
    groupColorHint: '品牌色用在按钮、链接与选中态；中性色决定背景、文字与边框的灰度',
    groupShape: '形状与尺寸',
    groupShapeHint: '圆角按比例作用在所有组件上；缩放同时改字号、间距与控件高度',
    groupType: '字体与动效',
    groupTypeHint: '标题的字体与过渡的快慢；系统开了“减少动态效果”时始终不播放',
    groupExport: '检查与导出',
    groupExportHint:
      '改动时实时检查对比度；代码可以直接交给 createUi 的 theme，Figma 变量是 DTCG 格式的 JSON，在 Figma 的变量面板里导入',
  },
  'en-US': {
    accent: 'Accent',
    neutral: 'Neutral',
    themeDefault: 'Theme default',
    colorNames: {
      tomato: 'Tomato',
      red: 'Red',
      ruby: 'Ruby',
      crimson: 'Crimson',
      pink: 'Pink',
      plum: 'Plum',
      purple: 'Purple',
      violet: 'Violet',
      iris: 'Iris',
      indigo: 'Indigo',
      blue: 'Blue',
      sky: 'Sky',
      cyan: 'Cyan',
      teal: 'Teal',
      jade: 'Jade',
      mint: 'Mint',
      green: 'Green',
      grass: 'Grass',
      lime: 'Lime',
      yellow: 'Yellow',
      amber: 'Amber',
      orange: 'Orange',
      brown: 'Brown',
      bronze: 'Bronze',
      gold: 'Gold',
      slate: 'Slate',
      gray: 'Gray',
      mauve: 'Mauve',
      sage: 'Sage',
      olive: 'Olive',
      sand: 'Sand',
    },
    radius: 'Radius',
    radiusNone: 'None',
    radiusSmall: 'Small',
    radiusMedium: 'Medium',
    radiusLarge: 'Large',
    scaling: 'Scaling',
    font: 'Font',
    fontSans: 'Sans',
    fontSerifHeadings: 'Serif headings',
    motion: 'Motion',
    motionNone: 'Off',
    motionFast: 'Fast',
    motionNormal: 'Normal',
    motionSlow: 'Slow',
    contrast: 'Contrast',
    contrastOk: (count) => `All ${count} text and UI color pairs meet WCAG AA`,
    contrastIssue: (pair, ratio, minimum) => `${pair}: ${ratio}, needs ${minimum}`,
    code: 'Code',
    reset: 'Reset',
    download: 'Download',
    downloadTokens: 'Download Figma variables',
    groupColor: 'Color',
    groupColorHint:
      'Accent is used for buttons, links and selection; neutral sets the grays of backgrounds, text and borders',
    groupShape: 'Shape and size',
    groupShapeHint:
      'Radius scales every component proportionally; scaling changes font size, spacing and control height together',
    groupType: 'Type and motion',
    groupTypeHint:
      'Heading font and transition speed; transitions stay off when the system asks for reduced motion',
    groupExport: 'Check and export',
    groupExportHint:
      'Contrast is checked as you change things; the code can be passed straight to createUi’s theme, and the Figma variables are DTCG JSON you import in Figma’s variables panel',
  },
};
