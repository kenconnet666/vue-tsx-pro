import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/PropertyGridProps';
import editorApi from 'virtual:api/PropertyEditorProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Inspector from './demo/Inspector.tsx?demo';
import Light from './demo/Light.tsx?demo';

export const meta = {
  title: 'PropertyGrid 属性面板',
  description:
    '按字段描述画一组“名字加编辑器”的行，改了马上交出“路径加值”：编辑器的检查器、设计器的属性栏、调参面板。没有提交和校验，值由使用方存。',
  order: 4,
};

export default _component(() => () => (
  <DocPage
    meta={meta}
    imports="import { PropertyGrid, PropertyEditor, setPropertyPath, PROPERTY_MIXED } from '@zerodep-dev/vue-tsx-pro-ui';"
  >
    <Example id="light" title="灯光的属性" demo={Light}>
      <Code>fields</Code>
      {
        '是普通数据（能从引擎的组件、着色器参数生成）：数、开关、文字、枚举、向量、颜色、列表、对象、几种之一（'
      }
      <Code>union</Code>
      {'，换种类时留下共有的字段）、JSON。可选字段没写时名字淡一点，设回'}
      <Code>default</Code>
      {'时去掉这个键；没写的一组设置（阴影）先点“添加”。'}
      <Code>onSet</Code>
      {'给出路径和新值（或按原来的值算的函数），'}
      <Code>setPropertyPath</Code>
      {'把它落到值上。自己的种类（这里的贴图）经'}
      <Code>editors</Code>
      {'给编辑器，也能嵌在列表、对象里。多选时把不一样的值标成'}
      <Code>PROPERTY_MIXED</Code>
      {'，编辑器显示“多个值”，改的时候给函数，每个对象各算各的。'}
    </Example>
    <Example id="inspector" title="检查器：一个组件一节" demo={Inspector}>
      {'编辑器的检查器把每个组件放进一节'}
      <Code>FormSection</Code>
      {'：'}
      <Code>density="compact"</Code>
      {'让标题和字段贴得近、标题是正文字号，'}
      <Code>collapsible</Code>
      {'能收起，'}
      <Code>extra</Code>
      {'放去掉它的按钮；节里是这个组件的 PropertyGrid。'}
    </Example>
    <ApiReference api={[api, editorApi]} />
  </DocPage>
));
