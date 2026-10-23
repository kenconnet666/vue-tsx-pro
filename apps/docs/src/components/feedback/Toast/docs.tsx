import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/ToasterProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import { KeyboardReference } from '../../../site/KeyboardReference';
import Basic from './demo/Basic.tsx?demo';
import Layout from './demo/Layout.tsx?demo';
import Persistent from './demo/Persistent.tsx?demo';
import Shortcuts from './demo/Shortcuts.tsx?demo';

export const meta = {
  title: 'Toast 通知',
  description:
    '操作结果的短暂提示，几秒后自动消失：控制器 createToaster 在组件内外都能用，Toaster 是显示区域；可撤销、可跟踪一个 Promise。',
  order: 3,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { createToaster, Toaster } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="basic" title="基础用法" demo={Basic}>
          应用里用 <Code>createToaster()</Code> 创建一次控制器（普通对象，请求拦截器、store
          里也能导入），放一个 <Code>Toaster</Code> 显示区域，然后在任意位置{' '}
          <Code>toaster.show(…)</Code>。每条通知就是 Alert：图标、标题、正文、操作、关闭按钮都一样；
          <Code>toaster.promise</Code> 跟踪一个 Promise，从加载中换成成功或失败。默认 5
          秒后消失，指针停在上面、焦点在里面、页面切到后台时暂停；横向滑动可以关掉。
        </Example>
        <Example id="persistent" title="常驻与更新" demo={Persistent}>
          <Code>duration: Infinity</Code> 不自动消失，<Code>closable: false</Code>{' '}
          去掉关闭按钮——问题解决前一直提醒。<Code>toaster.update(id, …)</Code>{' '}
          把同一条通知换成新的内容，计时按新的 <Code>duration</Code> 重新开始；<Code>icon</Code>{' '}
          换掉按色调选的图标。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="layout" title="位置、叠放与剩余时间" demo={Layout}>
          <Code>placement</Code> 是视口的六个位置；<Code>stack</Code> 像 Sonner
          一样叠成一摞，悬停或聚焦时展开；
          <Code>progress</Code> 在底部显示剩余时间，暂停时一起停；<Code>max</Code>{' '}
          限制同时显示的条数，更早的先排队。<Code>createToaster({'{ duration }'})</Code>{' '}
          改默认的显示时长。
        </Example>
        <Example id="shortcuts" title="快捷方法、同 id 只留一条、关闭回调" demo={Shortcuts}>
          <Code>toaster.success</Code> / <Code>error</Code> / <Code>warning</Code> /{' '}
          <Code>info</Code> / <Code>loading</Code> 第一个参数是标题；<Code>error</Code>{' '}
          默认读屏立即播报，<Code>loading</Code> 不自动消失。写了 <Code>id</Code>{' '}
          的通知只有一条：同一个 id 再显示时换掉原来那条并重新计时，连点保存、接口重试不会堆一摞；先{' '}
          <Code>loading('正在导出', {'{ id }'})</Code>，完成后{' '}
          <Code>success('已导出', {'{ id }'})</Code> 原地换成结果。<Code>onClose(reason)</Code>{' '}
          在开始关闭时调用，<Code>reason</Code> 是到时（timeout）还是被关掉（dismissed）。
        </Example>
      </ExampleColumn>
    </Examples>
    <KeyboardReference
      keys={[
        ['F8', '有通知时焦点跳到通知区域；区域里有焦点时计时暂停'],
        ['Tab / Shift+Tab', '在通知的操作、关闭按钮之间移动'],
        ['Esc', '关闭焦点所在的通知，焦点交给相邻的通知，没有时回到进入区域之前的位置'],
      ]}
    >
      通知区域是 aria-live 的 <Code>section</Code>：新通知出现时读屏自动念出，焦点不会被抢走。按{' '}
      <Kbd>F8</Kbd> 才进入区域。
    </KeyboardReference>
    <ApiReference api={api} />
  </DocPage>
));
