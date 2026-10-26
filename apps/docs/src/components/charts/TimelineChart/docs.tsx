import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/TimelineChartProps';
import itemApi from 'virtual:api/TimelineChartItem';
import seriesApi from 'virtual:api/TimelineChartSeries';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Projects from './demo/Projects.tsx?demo';
import Shifts from './demo/Shifts.tsx?demo';

export const meta = {
  title: 'TimelineChart 时间条图',
  description:
    '甘特图式的时间条：每行一个任务，横轴是时间；计划画成浅色轨道、实际画在上面，标出今天与里程碑。',
  order: 10.5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { TimelineChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';"
  >
    <Example id="projects" title="项目进度：计划与实际" demo={Projects}>
      <Code>items</Code> 的每一项是一段：所在的行（<Code>row</Code>）、开始与结束（Date、时间戳或
      ISO 字符串，只有日期的结束含这一天）、系列。<Code>series</Code> 的{' '}
      <Code>variant="track"</Code>{' '}
      画成宽而浅的轨道、在下面（计划），默认的实心条画在上面（实际）；单独一段可以用{' '}
      <Code>color</Code> 标红。<Code>today</Code> 画出今天（可以给一个日期），<Code>markers</Code>{' '}
      是里程碑、截止日的竖线。悬停一段看起止与天数，点图例隐藏系列；读屏的数据表列出每一段。
    </Example>
    <Example id="shifts" title="按小时：设备排班" demo={Shifts}>
      时间带时分时按时区换算；<Code>dateFormat</Code> 决定刻度的写法（这里是“时:分”），
      <Code>rowHeight</Code> 是行高，图的高度按行数算。
    </Example>
    <ApiReference api={[api, itemApi, seriesApi]} />
  </DocPage>
));
