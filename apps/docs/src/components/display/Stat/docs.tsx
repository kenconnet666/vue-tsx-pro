import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/StatProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';
import Change from './demo/Change.tsx?demo';
import Live from './demo/Live.tsx?demo';
import Loading from './demo/Loading.tsx?demo';

export const meta = {
  title: 'Stat 统计数值',
  description: '一个关键指标：名称、数值与单位、图标、环比变化。仪表盘顶部的一排卡片。',
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Stat } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="basic" title="基础用法" demo={Basic}>
        Stat 只是内容，放进 Card、Grid 里组合。数字按当前语言格式化，<Code>format</Code>{' '}
        控制小数位； 结构是 <Code>dl</Code>，读屏按“名称—数值”成对朗读，图标对读屏隐藏。
      </Example>
      <Example id="change" title="变化量" demo={Change}>
        <Code>change</Code>{' '}
        默认按百分比显示，上升为成功色、下降为危险色；成本、耗时这类越低越好的指标写{' '}
        <Code>invertChange</Code>。
      </Example>
      <Example id="live" title="数值变化" demo={Live}>
        数值变化时从旧值滚动到新值（AnimatedNumber），读屏只读终值；减少动态效果时直接跳到新值。
        下方的迷你趋势是示例自己拼的最近 12 次取值，装饰性、对读屏隐藏。
      </Example>
      <Example id="loading" title="加载中" demo={Loading}>
        <Code>loading</Code> 时数值与变化量换成骨架，一道光带从起始边扫过，指标名照常显示； Card 的{' '}
        <Code>loading</Code> 把正文换成几行骨架。骨架对读屏隐藏，外层带 <Code>aria-busy</Code>
        ；很快完成的加载不出现骨架，减少动态效果时不扫光。
      </Example>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
