import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/RatingProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Review from './demo/Review.tsx?demo';
import Variants from './demo/Variants.tsx?demo';

export const meta = {
  title: 'Rating 评分',
  description: '几颗星里选一个分数：供应商评价、满意度、优先级。可以半星，可以只读显示。',
  order: 15,
};

export default _component(() => () => (
  <DocPage meta={meta} imports="import { Rating } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="review" title="供应商评价" demo={Review}>
          可编辑时是单选组：每颗星是一个原生
          radio（视觉上隐藏），方向键、表单提交、读屏都是原生的，名称是“3
          星”这样的文字。指针悬停时预览将要选的分数，再点一次已选的分数清空（<Code>clearable</Code>
          ，默认开）。<Code>allowHalf</Code> 每颗星左右各一半。<Code>readonly</Code>{' '}
          只显示：整排是一个 role="img"，读“4.5 星，满分 5 星”。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="variants" title="图标、颜色与只读列表" demo={Variants}>
          <Code>icon</Code> 换图标（心、火焰），<Code>tone</Code>{' '}
          换选中的颜色，默认金黄（warning）；
          <Code>count</Code> 改星数，<Code>size</Code>{' '}
          跟字号档位缩放。评论列表里用只读的小号评分，旁边写上分数或文字。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['Tab', '进入评分（落在已选的分数上，没选时落在第一颗）'],
        ['← / → 或 ↑ / ↓', '改分数（同单选组）'],
        ['Space', '选中当前聚焦的分数'],
      ]}
    />
    <ApiReference api={api} />
  </DocPage>
));
