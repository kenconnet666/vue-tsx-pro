import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/CanProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Roles from './demo/Roles.tsx?demo';

export const meta = {
  title: 'Can 权限显示',
  description:
    '按权限点显示按钮等界面：有权限才渲染，没有时渲染 fallback；权限从哪来由应用在 createUi 的 permissions 里接入。',
  order: 30,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Can, useCan } from '@zerodep-dev/vue-tsx-pro-ui';">
    <Examples>
      <ExampleColumn>
        <Example id="roles" title="按角色显示按钮" demo={Roles}>
          组件库不知道权限从哪来（后端返回的权限点、角色…），应用在 <Code>createUi</Code> 或{' '}
          <Code>Provider</Code> 的 <Code>permissions</Code> 里接入一个{' '}
          <Code>{'(权限点) => boolean'}</Code>
          ，在渲染时读响应式状态，登录、退出、换角色后界面随之更新。
          <Code>Can</Code> 的 <Code>permission</Code> 给数组时有其中任意一个就算有；
          <Code>fallback</Code> 是没有权限时显示的内容。要自己判断（禁用按钮、过滤菜单项）时用{' '}
          <Code>useCan()</Code>。
          {
            '没接入 permissions 时一律放行，没有权限体系的应用不受影响。这只控制界面，不是安全边界：接口上的权限校验才是。'
          }
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
