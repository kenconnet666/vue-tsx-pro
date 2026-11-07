/** 指南：无障碍。组件库在键盘、读屏、视觉、动效、从右到左上做了什么，怎样检查，使用方要做的事 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code, CodeBlock, Flex, H2, List, ListItem, Paragraph } from '@zerodep-dev/vue-tsx-pro-ui';
import { DocPage } from '../../site/DocPage';

const meta = {
  title: 'Accessibility 无障碍',
  description:
    '键盘、读屏、对比度、减少动态效果、从右到左：组件库默认做到的，怎样在浏览器里检查，以及使用方要补上的名称与说明。',
};

const naming = `// 没有可见标签的控件：写 aria-label
<IconButton icon={Trash2} aria-label="删除这一行" />
<TextField type="search" aria-label="搜索订单" />

// 有标签时放进 Field：标签、说明、错误、必填自动关联到里面的控件
<Field label="交付日期" description="工作日" error={errors.date} required>
  <DatePicker _value={date} />
</Field>

// 表格、列表、树、图表都要有名称
<DataTable rows={orders} columns={columns} aria-label="待发货订单" />
<LineChart data={sales} aria-label="近 12 个月销售额" />`;

const announcing = `import { announce } from '@zerodep-dev/vue-tsx-pro-ui';

// 页面上看得见、读屏却不知道的变化：批量操作的结果、后台完成的任务
announce('已归档 12 条订单');
announce('导入失败：第 3 行缺少供应商', 'assertive');`;

const sections: { id: string; title: string; intro: string; items: string[] }[] = [
  {
    id: 'keyboard',
    title: '键盘',
    intro: '鼠标能做的，键盘都能做；每个组件页底部的“键盘”一节列出了全部按键。',
    items: [
      '能操作的元素都在 Tab 顺序里，焦点环只在键盘操作时出现（:focus-visible），按 Tab 时看得见焦点在哪。',
      '一组同类的项（Tabs、ToggleGroup、Toolbar、菜单、列表框）整组一个 Tab 位置，组内用方向键移动（漫游焦点）；表格的单元格导航、日历是二维的网格。',
      '浮层（Dialog、Drawer、Popover、Menu）打开时焦点移进去、Tab 在里面循环，Esc 关闭后焦点回到打开它的按钮。',
      '拖动的操作（排序、分栏、调整列宽、滑块）都有键盘替代：聚焦后用空格拿起、方向键移动，或直接方向键调整。',
    ],
  },
  {
    id: 'screen-reader',
    title: '读屏',
    intro: '原生元素优先，原生没有的按 WAI-ARIA 的设计模式做。',
    items: [
      '按钮就是 button、链接就是 a、对话框是原生 dialog、浮层用 popover 属性：读屏、浏览器的焦点管理都按原生的来。',
      'Select、Combobox 是 combobox + listbox，Tree 是 tree，单元格导航的表格是 grid，滑块是 slider……状态写在 aria-expanded、aria-selected、aria-checked、aria-current 上。',
      '虚拟滚动只渲染看得见的几十项，但总数与位置照样告诉读屏（aria-setsize / aria-posinset、aria-rowcount / aria-rowindex、aria-colcount / aria-colindex）。',
      '看得见、读屏却不知道的变化（搜索结果的条数、复制成功、拖动后的位置）由组件播报；自己的页面用 announce。',
    ],
  },
  {
    id: 'visual',
    title: '视觉',
    intro: '颜色、尺寸都来自主题 token，内置主题在构建时逐对检查对比度。',
    items: [
      '内置的每套主题，正文文字对比度不低于 4.5:1、图形与界面部件（边框、焦点环）不低于 3:1（WCAG 2.2 AA），pnpm themes:check 逐对 token 检查；高对比主题更高。',
      'Windows 的高对比模式（forced-colors）下，状态改用系统颜色表示（选中、焦点、当前项），不靠背景色。',
      '尺寸都用 em：放大浏览器字号、或给一块区域设更大的字号，组件跟着缩放；可以点的区域不小于 24 × 24 px。',
      '状态不只靠颜色：出错有图标与文字，选中有对勾，必填有星号、控件带 aria-required。',
    ],
  },
  {
    id: 'motion',
    title: '动效',
    intro: '动效帮助理解变化，不是装饰。',
    items: [
      '偏好减少动态效果（prefers-reduced-motion）时，过渡与动画的时长 token 变成 0，平滑滚动改成直接跳过去；轮播一开始就是暂停的。',
      '会动的内容（轮播、跑马灯、自动刷新）都能暂停，指针停留、焦点进入时也会自己停下。',
    ],
  },
  {
    id: 'rtl',
    title: '从右到左',
    intro: '阿拉伯语、希伯来语这类从右到左的语言：在页面或容器上写 dir="rtl"。',
    items: [
      '样式用逻辑方向（起始边、结束边：insetInlineStart、paddingInlineEnd），换方向时整套镜像。',
      '左右方向键的含义跟着换（“下一个”永远朝阅读方向），表示方向的图标（箭头、展开的三角）镜像，时钟、播放这类不镜像。',
      '示例卡片右上角的“示例工具”可以把任何一个示例切到从右到左、窄屏、放大字号与反色主题，看看是否还对。',
    ],
  },
];

export default _component(() => () => (
  <DocPage meta={meta}>
    <Paragraph>
      {
        '无障碍不是最后补上的一层：组件按 WAI-ARIA 的设计模式做，键盘与读屏的行为写在每个组件页底部，文档站的每个示例都在真实浏览器里过一遍 axe-core。下面是组件库默认做到的，以及使用方要补上的部分。'
      }
    </Paragraph>
    {sections.map((section) => (
      <Flex key={section.id} direction="column" gap="md">
        <H2 id={section.id} size="xl" anchor>
          {section.title}
        </H2>
        <Paragraph>{section.intro}</Paragraph>
        <List>
          {section.items.map((item) => (
            <ListItem key={item}>{item}</ListItem>
          ))}
        </List>
      </Flex>
    ))}
    <Flex direction="column" gap="md">
      <H2 id="your-part" size="xl" anchor>
        使用方要做的
      </H2>
      <Paragraph>
        {
          '组件不知道一个只有图标的按钮是做什么的、一张表格装的是什么：名称要由使用方给。有可见的标签时用 Field，没有时写 aria-label；图片写 alt，纯装饰的写空的 alt。'
        }
      </Paragraph>
      <CodeBlock title="名称" code={naming} lang="tsx" />
      <Paragraph>
        <Code>announce</Code>
        {
          ' 往读屏的播报区写一句话（polite 等读屏说完当前的话，assertive 立即打断），整个应用共用一个播报区：'
        }
      </Paragraph>
      <CodeBlock title="播报" code={announcing} lang="ts" />
    </Flex>
    <Flex direction="column" gap="md">
      <H2 id="testing" size="xl" anchor>
        怎样检查
      </H2>
      <List>
        <ListItem>
          {
            '只用键盘走一遍：Tab 到每个能操作的地方、看得见焦点、能打开也能关上、关上后焦点回到原处。'
          }
        </ListItem>
        <ListItem>
          {
            '打开读屏（Windows 的讲述人或 NVDA、macOS 的 VoiceOver）听一遍：每个控件有名称、状态说得清楚、变化有播报。'
          }
        </ListItem>
        <ListItem>
          {
            '用 axe-core（浏览器扩展或测试里）扫一遍页面：文档站的全部示例在亮、暗两套主题下都扫，CI 不过不合并。'
          }
        </ListItem>
        <ListItem>
          {
            '组件测试按角色与名称找元素（getByRole，或查 role 与 aria-label），而不是按类名：找不到时多半是名称或角色漏了。'
          }
        </ListItem>
      </List>
    </Flex>
  </DocPage>
));
