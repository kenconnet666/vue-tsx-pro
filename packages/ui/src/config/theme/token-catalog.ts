// 由 scripts/css-docs/generate.mjs 根据 tokens.stylex.ts 生成，请勿手改。

/** 一个主题 token */
export interface TokenEntry {
  /** 键，如 accent */
  readonly name: string;
  /** 默认值（亮色主题） */
  readonly value: string;
  /** 说明 */
  readonly description: string;
}

/** 一组主题 token */
export interface TokenGroupEntry {
  /** 组名，如 colors */
  readonly name: string;
  /** 说明 */
  readonly description: string;
  /** 组里的 token */
  readonly tokens: readonly TokenEntry[];
}

/** 主题 tokens 的清单：每组每个 token 的默认值与说明（主题编辑器、文档的 token 表用它） */
export const tokenCatalog: readonly TokenGroupEntry[] = [
  {
    name: 'colors',
    description: '颜色：slate 中性色、indigo 品牌色、red 危险、green 成功、amber 警告、blue 信息',
    tokens: [
      {
        name: 'background',
        value: '#fcfcfd',
        description: '页面背景。slate 1：亮色 `#fcfcfd`，暗色 `#111113`',
      },
      {
        name: 'surface',
        value: '#fcfcfd',
        description: '卡片、输入框等表面。亮色 slate 1 `#fcfcfd`，暗色 slate 2 `#18191b`',
      },
      {
        name: 'surfaceMuted',
        value: '#f9f9fb',
        description: '弱化的区域背景：表头、侧栏、代码块。slate 2：亮色 `#f9f9fb`，暗色 `#18191b`',
      },
      {
        name: 'surfaceRaised',
        value: '#fcfcfd',
        description:
          '浮层（弹出框、菜单、对话框）表面。亮色 slate 1 `#fcfcfd`（靠阴影区分），暗色 slate 3 `#212225`',
      },
      {
        name: 'fill',
        value: '#f0f0f3',
        description: '填充：标签、开关关闭态、弱按钮。slate 3：亮色 `#f0f0f3`，暗色 `#212225`',
      },
      {
        name: 'fillHover',
        value: '#e8e8ec',
        description:
          '填充悬停；也用于幽灵按钮、菜单项的悬停背景。slate 4：亮色 `#e8e8ec`，暗色 `#272a2d`',
      },
      {
        name: 'fillActive',
        value: '#e0e1e6',
        description: '填充按下、选中。slate 5：亮色 `#e0e1e6`，暗色 `#2e3135`',
      },
      {
        name: 'text',
        value: '#1c2024',
        description: '主要文字。slate 12：亮色 `#1c2024`，暗色 `#edeef0`',
      },
      {
        name: 'textMuted',
        value: '#60646c',
        description: '次要文字、说明、图标。slate 11：亮色 `#60646c`，暗色 `#b0b4ba`',
      },
      {
        name: 'textPlaceholder',
        value: '#80838d',
        description: '输入框占位文字。slate 10：亮色 `#80838d`，暗色 `#777b84`',
      },
      {
        name: 'textDisabled',
        value: '#b9bbc6',
        description: '不可用的文字。slate 8：亮色 `#b9bbc6`，暗色 `#5a6169`',
      },
      {
        name: 'borderMuted',
        value: '#d9d9e0',
        description: '弱边框：分割线、表格线。slate 6：亮色 `#d9d9e0`，暗色 `#363a3f`',
      },
      {
        name: 'border',
        value: '#cdced6',
        description: '普通边框：输入框、卡片、浮层。slate 7：亮色 `#cdced6`，暗色 `#43484e`',
      },
      {
        name: 'borderStrong',
        value: '#b9bbc6',
        description: '强调边框：悬停。slate 8：亮色 `#b9bbc6`，暗色 `#5a6169`',
      },
      {
        name: 'accent',
        value: '#3e63dd',
        description: '品牌色实色：主按钮、选中的复选框。indigo 9：两套主题都是 `#3e63dd`',
      },
      {
        name: 'accentHover',
        value: '#3358d4',
        description:
          '品牌色实色悬停。亮色 indigo 10 `#3358d4`；暗色比实色更深一点 `#3758d4`（indigo 10 `#5472e4` 配白字只有 4.28:1）',
      },
      {
        name: 'accentContrast',
        value: '#ffffff',
        description: '品牌色实色上的文字与图标。Radix 规定 indigo 9 上用白字：`#ffffff`',
      },
      {
        name: 'accentText',
        value: '#3a5bc7',
        description: '品牌色文字：链接、选中项的文字。indigo 11：亮色 `#3a5bc7`，暗色 `#9eb1ff`',
      },
      {
        name: 'accentSoft',
        value: '#edf2fe',
        description: '品牌色浅底：选中行、弱主按钮。indigo 3：亮色 `#edf2fe`，暗色 `#182449`',
      },
      {
        name: 'accentSoftHover',
        value: '#e1e9ff',
        description: '品牌色浅底悬停。indigo 4：亮色 `#e1e9ff`，暗色 `#1d2e62`',
      },
      {
        name: 'accentBorder',
        value: '#abbdf9',
        description:
          '品牌色边框：选中的卡片、弱主按钮描边。indigo 7：亮色 `#abbdf9`，暗色 `#3a4f97`',
      },
      {
        name: 'danger',
        value: '#ce2c31',
        description:
          '危险实色：危险按钮的底色，上面放 dangerContrast（白色）文字，要满足 4.5:1。 red 9 配白字只有 3.91:1，所以亮色用 red 11 `#ce2c31`（5.21:1），暗色用 red 8 `#b54548`（5.37:1）',
      },
      {
        name: 'dangerHover',
        value: '#b8272c',
        description:
          '危险实色悬停：比实色更深一点，白字才满足 4.5:1（red 10 只有 4.37:1）。亮色 `#b8272c`，暗色 `#a33b3e`',
      },
      {
        name: 'dangerContrast',
        value: '#ffffff',
        description: '危险实色上的文字与图标：`#ffffff`',
      },
      {
        name: 'dangerText',
        value: '#b8272c',
        description:
          '危险文字：错误提示。亮色比 red 11 深一点 `#b8272c`（red 11 在 dangerSoftHover 上只有 4.07:1），暗色 red 11 `#ff9592`',
      },
      {
        name: 'dangerSoft',
        value: '#feebec',
        description: '危险浅底：错误提示条。red 3：亮色 `#feebec`，暗色 `#3b1219`',
      },
      {
        name: 'dangerSoftHover',
        value: '#ffdbdc',
        description: '危险浅底悬停。red 4：亮色 `#ffdbdc`，暗色 `#500f1c`',
      },
      {
        name: 'dangerBorder',
        value: '#f4a9aa',
        description: '危险边框：校验失败的输入框。red 7：亮色 `#f4a9aa`，暗色 `#8c333a`',
      },
      {
        name: 'successText',
        value: '#193b2d',
        description:
          '成功文字与图标。亮色 green 12 `#193b2d`，暗色 green 11 `#3dd68c`。 亮色不用 11 级：green 11 在 successSoft（green 3）上只有 4.21:1，标记、提示条里的文字不到 4.5',
      },
      {
        name: 'successSoft',
        value: '#e6f6eb',
        description: '成功浅底。green 3：亮色 `#e6f6eb`，暗色 `#132d21`',
      },
      {
        name: 'successBorder',
        value: '#8eceaa',
        description: '成功边框。green 7：亮色 `#8eceaa`，暗色 `#28684a`',
      },
      {
        name: 'warningText',
        value: '#4f3422',
        description:
          '警告文字与图标。亮色 amber 12 `#4f3422`，暗色 amber 11 `#ffca16`。 亮色不用 11 级：amber 11（`#ab6400`）在页面背景上对比度 4.49，不到 WCAG AA 的 4.5',
      },
      {
        name: 'warningSoft',
        value: '#fff7c2',
        description: '警告浅底。amber 3：亮色 `#fff7c2`，暗色 `#302008`',
      },
      {
        name: 'warningBorder',
        value: '#e9c162',
        description: '警告边框。amber 7：亮色 `#e9c162`，暗色 `#714f19`',
      },
      {
        name: 'infoText',
        value: '#113264',
        description:
          '信息文字与图标。亮色 blue 12 `#113264`，暗色 blue 11 `#70b8ff`。 亮色不用 11 级：blue 11 在 infoSoft（blue 3）上只有 4.25:1',
      },
      {
        name: 'infoSoft',
        value: '#e6f4fe',
        description: '信息浅底。blue 3：亮色 `#e6f4fe`，暗色 `#0d2847`',
      },
      {
        name: 'infoBorder',
        value: '#8ec8f6',
        description: '信息边框。blue 7：亮色 `#8ec8f6`，暗色 `#205d9e`',
      },
      {
        name: 'inverseSurface',
        value: '#1c2024',
        description: '反色表面。slate 12：亮色 `#1c2024`，暗色 `#edeef0`',
      },
      {
        name: 'inverseText',
        value: '#fcfcfd',
        description: '反色表面上的文字。slate 1：亮色 `#fcfcfd`，暗色 `#111113`',
      },
      {
        name: 'focusRing',
        value: '#3e63dd',
        description:
          '焦点环（:focus-visible）。indigo 9：两套主题都是 `#3e63dd`。 Radix 建议 7–8 级，但亮色下对比度不到 3:1（WCAG 2.2 焦点外观要求），所以用 9 级',
      },
      {
        name: 'overlay',
        value: 'rgba(0, 0, 0, 0.4)',
        description:
          '模态遮罩。亮色 blackA 6 `rgba(0, 0, 0, 0.4)`，暗色 blackA 8 `rgba(0, 0, 0, 0.6)`',
      },
      {
        name: 'selection',
        value: '#d2deff',
        description: '选中文字的底色（::selection）。indigo 5：亮色 `#d2deff`，暗色 `#253974`',
      },
      {
        name: 'highlight',
        value: '#ffee9c',
        description: '高亮标记：搜索命中、`<mark>`。amber 4：亮色 `#ffee9c`，暗色 `#3f2700`',
      },
      {
        name: 'surfaceTranslucent',
        value: 'rgba(252, 252, 253, 0.8)',
        description: '半透明表面：吸顶的顶栏（配合背景模糊）。页面背景加 80% 不透明',
      },
      {
        name: 'codeKeyword',
        value: '#3a5bc7',
        description: '关键字。indigo 11：亮色 `#3a5bc7`，暗色 `#9eb1ff`',
      },
      {
        name: 'codeString',
        value: '#1c7a51',
        description:
          '字符串。亮色比 green 11 深一点 `#1c7a51`（在代码块背景上 green 11 只有 4.49:1），暗色 green 11 `#3dd68c`',
      },
      {
        name: 'codeNumber',
        value: '#c24b00',
        description:
          '数字、常量。亮色比 orange 11 深一点 `#c24b00`（orange 11 只有 4.29:1），暗色 orange 11 `#ffa057`',
      },
      {
        name: 'codeFunction',
        value: '#6550b9',
        description: '函数名。violet 11：亮色 `#6550b9`，暗色 `#baa7ff`',
      },
      {
        name: 'codeType',
        value: '#107d98',
        description: '类型、类名。cyan 11：亮色 `#107d98`，暗色 `#4ccce6`',
      },
      {
        name: 'codeComment',
        value: '#60646c',
        description: '注释、标点。slate 11：亮色 `#60646c`，暗色 `#b0b4ba`',
      },
      {
        name: 'codeTag',
        value: '#cb1d63',
        description: '标签名（HTML、JSX）。crimson 11：亮色 `#cb1d63`，暗色 `#ff92ad`',
      },
      {
        name: 'codeAttribute',
        value: '#815e46',
        description: '属性名。brown 11：亮色 `#815e46`，暗色 `#dbb594`',
      },
      {
        name: 'codeInserted',
        value: '#e6f6eb',
        description: 'diff 新增行的底色。green 3：亮色 `#e6f6eb`，暗色 `#132d21`',
      },
      {
        name: 'codeDeleted',
        value: '#feebec',
        description: 'diff 删除行的底色。red 3：亮色 `#feebec`，暗色 `#3b1219`',
      },
      {
        name: 'chart1',
        value: '#3e63dd',
        description: '第 1 个系列：跟随品牌色。indigo 9：两套主题都是 `#3e63dd`',
      },
      {
        name: 'chart2',
        value: '#0d9b8a',
        description: '第 2 个系列。teal：亮色 10 级 `#0d9b8a`，暗色 9 级 `#12a594`',
      },
      {
        name: 'chart3',
        value: '#ef5f00',
        description: '第 3 个系列。orange：亮色 10 级 `#ef5f00`，暗色 9 级 `#f76b15`',
      },
      {
        name: 'chart4',
        value: '#e93d82',
        description: '第 4 个系列。crimson 9：两套主题都是 `#e93d82`',
      },
      {
        name: 'chart5',
        value: '#6e56cf',
        description: '第 5 个系列。violet 9：两套主题都是 `#6e56cf`',
      },
      {
        name: 'chart6',
        value: '#0797b9',
        description: '第 6 个系列。cyan：亮色 10 级 `#0797b9`，暗色 9 级 `#00a2c7`',
      },
      {
        name: 'chart7',
        value: '#3e9b4f',
        description: '第 7 个系列。grass：亮色 10 级 `#3e9b4f`，暗色 9 级 `#46a758`',
      },
      {
        name: 'chart8',
        value: '#ab6400',
        description:
          '第 8 个系列。amber：亮色 11 级 `#ab6400`（9、10 级在浅色背景上不到 2:1），暗色 9 级 `#ffc53d`',
      },
    ],
  },
  {
    name: 'fonts',
    description: '字体族',
    tokens: [
      {
        name: 'sans',
        value:
          'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
        description:
          '正文字体：西文用系统界面字体；中文在 Windows 上优先“微软雅黑 UI”（界面字号下字距更紧凑）， Linux 上是思源黑体（Noto / Source Han Sans）',
      },
      {
        name: 'mono',
        value:
          'ui-monospace, "Cascadia Code", "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
        description:
          '等宽字体：代码、需要数字对齐的地方。装了 Cascadia Code（Windows 11 自带）、JetBrains Mono 时优先用它们， 字形比 Consolas 清楚',
      },
      {
        name: 'serif',
        value:
          '"Noto Serif SC", "Source Han Serif SC", "Songti SC", STSong, "SimSun", Georgia, serif',
        description: '衬线字体：书卷感的标题、引文（纸张主题的标题用它）',
      },
      {
        name: 'heading',
        value:
          'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif',
        description: '标题（H1–H6）的字体：默认同正文，主题可以换成衬线',
      },
    ],
  },
  {
    name: 'fontSizes',
    description: '字号：xs–xl 用于界面文字（也是组件 size 档位对应的字号），xxl、xxxl 用于标题',
    tokens: [
      {
        name: 'xs',
        value: '12px',
        description: '`12px`：辅助说明、标签',
      },
      {
        name: 'sm',
        value: '13px',
        description: '`13px`：紧凑控件',
      },
      {
        name: 'md',
        value: '14px',
        description: '`14px`：正文与默认控件；Provider 用它设置区域的基准字号',
      },
      {
        name: 'lg',
        value: '16px',
        description: '`16px`：宽松控件、小标题',
      },
      {
        name: 'xl',
        value: '18px',
        description: '`18px`：强调文字、卡片标题',
      },
      {
        name: 'xxl',
        value: '24px',
        description: '`24px`：页面标题',
      },
      {
        name: 'xxxl',
        value: '30px',
        description: '`30px`：大标题',
      },
    ],
  },
  {
    name: 'fontWeights',
    description: '字重',
    tokens: [
      {
        name: 'light',
        value: '300',
        description: '`300`',
      },
      {
        name: 'normal',
        value: '400',
        description: '`400`：正文',
      },
      {
        name: 'medium',
        value: '500',
        description: '`500`：标签、表头',
      },
      {
        name: 'semibold',
        value: '600',
        description: '`600`：按钮、标题',
      },
      {
        name: 'bold',
        value: '700',
        description: '`700`',
      },
    ],
  },
  {
    name: 'lineHeights',
    description: '行高（不带单位，随字号缩放）',
    tokens: [
      {
        name: 'none',
        value: '1',
        description: '`1`：图标、单行徽标',
      },
      {
        name: 'tight',
        value: '1.25',
        description: '`1.25`：按钮等单行控件、标题',
      },
      {
        name: 'snug',
        value: '1.375',
        description: '`1.375`：紧凑的多行文字',
      },
      {
        name: 'normal',
        value: '1.5',
        description: '`1.5`：正文',
      },
      {
        name: 'relaxed',
        value: '1.75',
        description: '`1.75`：长文阅读',
      },
    ],
  },
  {
    name: 'letterSpacings',
    description: '字间距（em，随字号缩放）：中文正文保持 normal，大字号标题可以略收紧',
    tokens: [
      {
        name: 'tighter',
        value: '-0.02em',
        description: '`-0.02em`：大标题',
      },
      {
        name: 'tight',
        value: '-0.01em',
        description: '`-0.01em`：小标题',
      },
      {
        name: 'normal',
        value: '0',
        description: '`0`：正文',
      },
      {
        name: 'wide',
        value: '0.02em',
        description: '`0.02em`：小字号的标签',
      },
      {
        name: 'wider',
        value: '0.05em',
        description: '`0.05em`：全大写的英文标签',
      },
    ],
  },
  {
    name: 'space',
    description: '间距：em，随组件字号缩放；页面级布局间距由宿主决定',
    tokens: [
      {
        name: 'none',
        value: '0',
        description: '`0`',
      },
      {
        name: 'xs',
        value: '0.25em',
        description: '`0.25em`：图标与文字之间、控件的上下内边距',
      },
      {
        name: 'sm',
        value: '0.5em',
        description: '`0.5em`：控件内部元素之间',
      },
      {
        name: 'md',
        value: '0.75em',
        description: '`0.75em`：输入框水平内边距、浮层内边距',
      },
      {
        name: 'lg',
        value: '1em',
        description: '`1em`：按钮水平内边距、表单项之间',
      },
      {
        name: 'xl',
        value: '1.5em',
        description: '`1.5em`：卡片、对话框内边距',
      },
    ],
  },
  {
    name: 'sizes',
    description:
      '尺寸：宽、高、最小最大尺寸。控件规格用 em 随字号缩放； 容器宽度（Container 与页面内容的最大宽度）是页面级的，用 rem，跟随浏览器的字号设置',
    tokens: [
      {
        name: 'control',
        value: '2.25em',
        description: '`2.25em`：单行控件（按钮、输入框、下拉框）的高度',
      },
      {
        name: 'minTarget',
        value: '24px',
        description: '`24px`：可点击区域的最小尺寸（WCAG 2.2 目标尺寸 24×24），与 control 取较大值',
      },
      {
        name: 'xs',
        value: '30rem',
        description: '`30rem`（480px）：窄内容，如登录表单',
      },
      {
        name: 'sm',
        value: '40rem',
        description: '`40rem`（640px）：表单页、设置页',
      },
      {
        name: 'md',
        value: '48rem',
        description: '`48rem`（768px）：文章、详情页',
      },
      {
        name: 'lg',
        value: '64rem',
        description: '`64rem`（1024px）：常规页面',
      },
      {
        name: 'xl',
        value: '80rem',
        description: '`80rem`（1280px）：宽表格、仪表盘',
      },
      {
        name: 'full',
        value: '100%',
        description: '`100%`：占满容器',
      },
    ],
  },
  {
    name: 'radii',
    description: '圆角：em，随组件字号缩放；整体改成直角或更圆时覆盖这一组',
    tokens: [
      {
        name: 'none',
        value: '0',
        description: '`0`',
      },
      {
        name: 'xs',
        value: '0.15em',
        description: '`0.15em`：控件内的小元素',
      },
      {
        name: 'sm',
        value: '0.25em',
        description: '`0.25em`：标签、复选框',
      },
      {
        name: 'md',
        value: '0.4em',
        description: '`0.4em`：按钮、输入框',
      },
      {
        name: 'lg',
        value: '0.7em',
        description: '`0.7em`：卡片、浮层',
      },
      {
        name: 'xl',
        value: '1em',
        description: '`1em`：对话框',
      },
      {
        name: 'full',
        value: '9999px',
        description: '全圆：胶囊按钮、头像、开关',
      },
    ],
  },
  {
    name: 'borderWidths',
    description: '边框与描边宽度（px，不随字号缩放）：边框、分隔线、焦点环的宽度与间隔',
    tokens: [
      {
        name: 'none',
        value: '0',
        description: '`0`',
      },
      {
        name: 'xs',
        value: '1px',
        description: '`1px`：边框、分隔线',
      },
      {
        name: 'sm',
        value: '2px',
        description: '`2px`：焦点环宽度与间隔、选中态的强调边框',
      },
      {
        name: 'md',
        value: '3px',
        description: '`3px`：提示条侧边的色条',
      },
      {
        name: 'lg',
        value: '4px',
        description: '`4px`',
      },
      {
        name: 'xl',
        value: '6px',
        description: '`6px`',
      },
    ],
  },
  {
    name: 'shadows',
    description:
      '阴影：取自 Radix Themes 的第 2–6 级，去掉了模拟边框的 1px 描边（组件自己画边框）；暗色主题另有一套',
    tokens: [
      {
        name: 'none',
        value: 'none',
        description: '无阴影',
      },
      {
        name: 'xs',
        value:
          '0 1px 1px 0 #00005506, 0 2px 1px -1px rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        description: '贴近表面：卡片',
      },
      {
        name: 'sm',
        value:
          '0 2px 3px -2px #0000330f, 0 3px 12px -4px rgba(0, 0, 0, 0.1), 0 4px 16px -8px rgba(0, 0, 0, 0.1)',
        description: '轻微浮起：悬停的卡片',
      },
      {
        name: 'md',
        value: '0 8px 40px rgba(0, 0, 0, 0.05), 0 12px 32px -16px #0000330f',
        description: '浮起：下拉面板',
      },
      {
        name: 'lg',
        value: '0 12px 60px rgba(0, 0, 0, 0.15), 0 12px 32px -16px #0009321f',
        description: '浮层：弹出框、菜单、提示',
      },
      {
        name: 'xl',
        value:
          '0 12px 60px rgba(0, 0, 0, 0.15), 0 16px 64px #00005506, 0 16px 36px -20px #00062e32',
        description: '对话框',
      },
    ],
  },
  {
    name: 'durations',
    description: '动效时长（参考 Material 3）；开启“减少动态效果”时自动为 0',
    tokens: [
      {
        name: 'none',
        value: '0ms',
        description: '`0ms`',
      },
      {
        name: 'xs',
        value: '75ms',
        description: '`75ms`：按下反馈',
      },
      {
        name: 'sm',
        value: '120ms',
        description: '`120ms`：悬停的颜色变化',
      },
      {
        name: 'md',
        value: '200ms',
        description: '`200ms`：展开、淡入、浮层出现',
      },
      {
        name: 'lg',
        value: '300ms',
        description: '`300ms`：对话框、抽屉',
      },
      {
        name: 'xl',
        value: '500ms',
        description: '`500ms`：大面积的页面切换',
      },
    ],
  },
  {
    name: 'easings',
    description: '缓动曲线（参考 Material 3）',
    tokens: [
      {
        name: 'standard',
        value: 'cubic-bezier(0.2, 0, 0, 1)',
        description: '标准：位置与尺寸变化',
      },
      {
        name: 'enter',
        value: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
        description: '进入：元素出现（先快后慢）',
      },
      {
        name: 'exit',
        value: 'cubic-bezier(0.3, 0, 0.8, 0.15)',
        description: '退出：元素消失（先慢后快）',
      },
    ],
  },
  {
    name: 'opacities',
    description: '不透明度',
    tokens: [
      {
        name: 'disabled',
        value: '0.5',
        description: '`0.5`：不可用的元素',
      },
    ],
  },
  {
    name: 'strokeWidths',
    description:
      'SVG 线宽（图标 24 格画布上的单位，不带单位）；Icon 默认 md，strokeWidth 可以逐个覆盖',
    tokens: [
      {
        name: 'xs',
        value: '1',
        description: '`1`：细线图标',
      },
      {
        name: 'sm',
        value: '1.5',
        description: '`1.5`',
      },
      {
        name: 'md',
        value: '2',
        description: '`2`：Lucide 的默认线宽',
      },
      {
        name: 'lg',
        value: '2.5',
        description: '`2.5`',
      },
      {
        name: 'xl',
        value: '3',
        description: '`3`：粗线图标',
      },
    ],
  },
];
