import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import abbrApi from 'virtual:api/AbbrProps';
import blockquoteApi from 'virtual:api/BlockquoteProps';
import headingApi from 'virtual:api/HeadingProps';
import kbdApi from 'virtual:api/KbdProps';
import linkApi from 'virtual:api/LinkProps';
import listItemApi from 'virtual:api/ListItemProps';
import listApi from 'virtual:api/ListProps';
import markApi from 'virtual:api/MarkProps';
import orderedListApi from 'virtual:api/OrderedListProps';
import api from 'virtual:api/TextProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Headings from './demo/Headings.tsx?demo';
import Inline from './demo/Inline.tsx?demo';
import Links from './demo/Links.tsx?demo';
import ListIcons from './demo/ListIcons.tsx?demo';
import Lists from './demo/Lists.tsx?demo';
import Numeric from './demo/Numeric.tsx?demo';
import Overflow from './demo/Overflow.tsx?demo';
import Scale from './demo/Scale.tsx?demo';
import Tones from './demo/Tones.tsx?demo';

export const meta = {
  title: 'Text 文字与列表',
  description:
    '正文、链接、标题与列表：字号、字重、色调、截断与换行；Paragraph、Strong、Em、Small、Sub、Sup、Del、Ins、Strike、Abbr、Link、Mark、Kbd、Blockquote、H1–H6，正文里的 List、OrderedList。',
  order: 0,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { Text, Paragraph, Strong, Em, Small, Sub, Sup, Del, Ins, Strike, Abbr, Link, Mark, Kbd, Blockquote, H1, H2, List, ListItem, OrderedList } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Examples>
      <ExampleColumn>
        <Example id="scale" title="字号与字重" demo={Scale}>
          <Code>size</Code> 对应主题的字号档位，<Code>weight</Code> 对应字重；不写时继承上下文，
          <Code>Small</Code> 默认 xs，<Code>Strong</Code> 默认 semibold。
        </Example>
        <Example id="tones" title="色调" demo={Tones}>
          <Code>tone</Code> 取主题的文字色，与 Button、Badge 的色调同名：neutral 是正文色，muted
          用于次要说明，其余是品牌色与提示色的文字色，在每套主题下都通过对比度检查。
        </Example>
        <Example id="overflow" title="截断与换行" demo={Overflow}>
          <Code>truncate</Code> 单行省略，<Code>lineClamp</Code> 限制行数；<Code>wrap</Code> 的
          pretty 避免最后一行只剩一个字（Paragraph 默认），balance 让标题各行长度均衡。
        </Example>
        <Example id="lists" title="列表：无序、有序与嵌套" demo={Lists}>
          正文里的列表：<Code>List</Code> 是圆点，<Code>OrderedList</Code> 是编号，
          <Code>start</Code>、<Code>reversed</Code> 这些原生属性照常可用；嵌套的列表紧贴上一项。
          <Code>spacing</Code> 改项与项之间的间距。界面里的列表（待办、通知）用
          ItemList，导航、步骤这类结构用 FlexList。
        </Example>
        <Example id="list-icons" title="图标代替圆点" demo={ListIcons}>
          <Code>icon</Code> 让每项前面画一个图标（功能清单的对勾），<Code>propsIcon</Code> 改颜色；
          <Code>ListItem</Code> 的 <Code>icon</Code> 逐项覆盖。图标是装饰，读屏照常念“列表，几项”。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="inline" title="行内语义" demo={Inline}>
          一个元素一个组件：<Code>Strong</Code>、<Code>Em</Code>、<Code>Small</Code>、
          <Code>Mark</Code>（高亮）、<Code>Kbd</Code>（按键）、<Code>Code</Code>
          （行内代码）、<Code>Blockquote</Code>（引用，<Code>source</Code> 写出处）。
          <Code>Sub</Code>、<Code>Sup</Code> 是上下标，不撑高所在的行；<Code>Strike</Code>{' '}
          是不再有效的内容（原价），文档的增删用 <Code>Del</Code>、<Code>Ins</Code>
          （加进来的是浅绿底，不用下划线，免得和链接分不清）。<Code>Abbr</Code>{' '}
          是缩写：全称在提示里，悬停、键盘聚焦、触屏点按都看得到（原生的 title 只有鼠标悬停才有）。
        </Example>
        <Example id="links" title="链接" demo={Links}>
          <Code>Link</Code> 默认带下划线（WCAG
          1.4.1：正文里的链接不能只靠颜色区分）；导航这类上下文明确的地方可以
          <Code>underline="hover"</Code> 或 none。条目列表、卡片页头、指标、时间线、描述列表里的
          Link 默认就是悬停才有下划线（这些容器经 <Code>LinkUnderlineScope</Code>{' '}
          {'给默认值，显式写的优先），正文里的照旧。按钮样式的链接用 LinkButton。'}
        </Example>
        <Example id="headings" title="标题" demo={Headings}>
          H1–H6 是六个组件，默认字号依次减小；级别要连续，视觉层级用 <Code>size</Code> 单独改。
          <Code>anchor</Code> 加指向本节的锚点链接。
        </Example>
        <Example id="numeric" title="编号与数字" demo={Numeric}>
          <Code>mono</Code> 用等宽字体（编号、件号），<Code>numeric</Code>{' '}
          用等宽数字（金额、计数）：上下对齐、变化时不跳动。表格的单元格默认就是等宽数字。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference
      api={[
        api,
        headingApi,
        linkApi,
        markApi,
        kbdApi,
        abbrApi,
        blockquoteApi,
        listApi,
        orderedListApi,
        listItemApi,
      ]}
    />
  </DocPage>
));
