import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/MapChartProps';
import areaApi from 'virtual:api/MapArea';
import pointApi from 'virtual:api/MapPoint';
import linkApi from 'virtual:api/MapLink';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Change from './demo/Change.tsx?demo';
import Projections from './demo/Projections.tsx?demo';
import Provinces from './demo/Provinces.tsx?demo';
import Regions from './demo/Regions.tsx?demo';
import Sites from './demo/Sites.tsx?demo';
import SupplyChain from './demo/SupplyChain.tsx?demo';

export const meta = {
  title: 'MapChart 地图',
  description:
    '按区域着色（分省的金额、各国的采购额），标出地点与流向；地理数据是 TopoJSON，Unovis 自带中国省份、世界等。',
  order: 11,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports={
      "import { MapChart } from '@zerodep-dev/vue-tsx-pro-ui/charts';\nimport { ChinaTopoJSON } from '@unovis/ts/maps';"
    }
  >
    <Example id="provinces" title="各省的销售额：分级着色、省名、仓库" demo={Provinces}>
      <Code>topology</Code> 是 TopoJSON，<Code>feature</Code> 是要画的那组要素（中国省份是{' '}
      <Code>provinces</Code>）。
      <Code>areas</Code> 按要素的 <Code>id</Code> 给名称与数值；<Code>bins</Code>{' '}
      分成几档着色，图例是几个色块（不写时连续着色，图例是色带），
      <Code>areaLabels</Code> 把名称写在区域上。<Code>points</Code> 是经纬度上的地点，
      <Code>value</Code> 决定大小（面积按比例）。
      <Code>zoomable</Code> 可以拖动、按住 Ctrl
      滚轮缩放（直接滚轮照常滚动页面），右上角有放大、缩小、复位；
      <Code>onAreaClick</Code>、<Code>onPointClick</Code> 下钻。
    </Example>
    <Examples>
      <ExampleColumn>
        <Example id="projections" title="投影" demo={Projections}>
          默认按地理数据的范围选投影：一个国家、一个地区用以它为中心的等积圆锥投影（
          <Code>conic</Code>，中国地图常用的 Albers，正着、面积不失真），跨了大半个地球时用{' '}
          <Code>naturalEarth</Code>。也可以指定 <Code>mercator</Code>、<Code>equalEarth</Code>、
          <Code>orthographic</Code>（地球仪）或自己的 d3 投影；<Code>center</Code> 改投影的中心。
        </Example>
        <Example id="regions" title="分类着色" demo={Regions}>
          区域写了 <Code>color</Code>{' '}
          时按它着色、不按数值（所属大区、负责的团队）；所有区域都指定了颜色时不显示色带。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="change" title="涨跌：发散配色" demo={Change}>
          <Code>scheme="diverging"</Code> 以 <Code>midpoint</Code>（默认 0）为界，两头用{' '}
          <Code>divergingColors</Code>（默认 danger、success），离分界越远越深；色带中间是底色。
        </Example>
        <Example id="sites" title="只标地点" demo={Sites}>
          不给区域数值时区域是底色，只看 <Code>points</Code>：<Code>color</Code>{' '}
          用语义色表示状态，大小按 <Code>value</Code>；<Code>onPointClick</Code>{' '}
          看详情。地点的名字自动避让：挤在一起时换到放得下的方位，再挤就往外退、画引线连回地点，数值大的先挑位置，放不下的不显示（悬停看）；压在名字、地点上的区域名会藏起来。
        </Example>
      </ExampleColumn>
    </Examples>
    <Example id="supply-chain" title="全球供应链：流向" demo={SupplyChain}>
      世界地图（<Code>WorldMap110mAlphaTopoJSON</Code>，ISO 两位国家代码）。<Code>links</Code>{' '}
      是地点之间的流向，粗细按 <Code>value</Code>，<Code>flow</Code> 时有流动的粒子；地点的{' '}
      <Code>shape</Code> 与 <Code>color</Code> 区分供应商与组装厂；<Code>center</Code>{' '}
      把中央经线放在东经 110°，中国在中间。悬停看名称与数值；读屏的数据表列出各区域、地点与流向。
    </Example>
    <ApiReference api={[api, areaApi, pointApi, linkApi]} />
  </DocPage>
));
