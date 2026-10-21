import { _component } from '@vue-tsx-pro/tsx';
import { Code, Kbd } from '@vue-tsx-pro/ui';
import api from 'virtual:api/CommandPaletteBaseProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import { ExampleColumn, Examples } from '../../../site/Examples';
import Commands from './demo/Commands.tsx?demo';
import People from './demo/People.tsx?demo';

export const meta = {
  title: 'CommandPalette 命令面板',
  description:
    '快捷键或按钮打开的搜索对话框：边输入边过滤，回车执行。站内搜索、后台的“跳转到…”、提及成员都用它；本站右上角的搜索就是。',
  order: 4,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { CommandPalette } from '@vue-tsx-pro/ui';">
    <Examples>
      <ExampleColumn>
        <Example id="commands" title="命令与页面" demo={Commands}>
          选项按 <Code>group</Code> 分组，可以带图标、说明、不可用。焦点一直在输入框里：<Kbd>↑</Kbd>{' '}
          <Kbd>↓</Kbd> 移动高亮，<Kbd>Enter</Kbd> 执行，<Kbd>Esc</Kbd> 关闭。<Code>hotkey</Code>{' '}
          默认是 Mod+K（本站的搜索占用了），这里换成 Mod+J。
        </Example>
      </ExampleColumn>
      <ExampleColumn>
        <Example id="custom" title="任意数据与自定义选项" demo={People}>
          后端数据直接给 <Code>items</Code>，<Code>toOption</Code> 说明值、文字和分组；
          <Code>filter</Code> 自定义匹配（这里姓名、邮箱都能搜），<Code>renderOption</Code>{' '}
          自定义每一项的内容；<Code>trigger</Code> 换成自己的按钮，<Code>hotkey={'{false}'}</Code>{' '}
          不注册快捷键。
        </Example>
      </ExampleColumn>
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
