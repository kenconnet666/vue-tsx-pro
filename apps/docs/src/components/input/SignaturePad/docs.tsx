import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/SignaturePadProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Export from './demo/Export.tsx?demo';
import Receipt from './demo/Receipt.tsx?demo';

export const meta = {
  title: 'SignaturePad 手写签名',
  description:
    '审批签字、签收、合同确认：用鼠标、触控笔或手指写，笔画随速度粗细，可以撤销、清空，值是 PNG，随表单提交，也能导出 SVG。',
  order: 19,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { SignaturePad } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="receipt" title="签收" demo={Receipt}>
          <Code>_value</Code>
          {
            ' 是透明底的 PNG（data URL），每写完一笔更新，没签时是 null；写了 name 时随表单提交。外框同输入框（Field 的出错、不可用、只读都认），底色与墨色是“纸面”：深色主题下仍是白底深色，导出的图放到白纸上看得见。写过之后右上角有撤销上一笔、清空。'
          }
          <Code>readonly</Code>
          {
            ' 时显示已签的图（父级给的 value），不能写；编辑页把读回的旧签名放进 value，可以接着写或清空。'
          }
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="export" title="导出与笔触" demo={Export}>
          <Code>handle</Code> 拿到 <Code>toPng()</Code>、<Code>toSvg()</Code>
          （笔画是路径，放大不糊）、
          <Code>undo()</Code>、<Code>clear()</Code>。<Code>penColor</Code> 是墨色，
          <Code>minWidth</Code>、<Code>maxWidth</Code>
          {' 是笔宽的范围：写得越快越细，同真的笔一样。触摸时不滚动页面，手指的移动都是笔画。'}
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
