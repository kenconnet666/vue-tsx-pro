import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ToasterProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';

export const meta = {
  title: 'Toast 通知',
  description:
    '操作结果的短暂提示，几秒后自动消失：控制器 createToaster 在组件内外都能用，Toaster 是显示区域；可撤销、可跟踪一个 Promise。',
  order: 2,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { createToaster, Toaster } from '@vue-tsx-pro/ui';">
    <Example id="basic" title="基础用法" demo={Basic}>
      应用里用 <Code>createToaster()</Code> 创建一次控制器（普通对象，请求拦截器、store
      里也能导入），放一个 <Code>Toaster</Code> 显示区域，然后在任意位置{' '}
      <Code>toaster.show(…)</Code>。每条通知就是 Alert：图标、标题、正文、操作、关闭按钮都一样；
      <Code>toaster.promise</Code> 跟踪一个 Promise，从加载中换成成功或失败。默认 5
      秒后消失，指针停在上面、焦点在里面、页面切到后台时暂停；F8 跳到通知区域，横向滑动可以关掉。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
