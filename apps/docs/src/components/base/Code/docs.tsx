import { _component } from '@vue-tsx-pro/tsx';
import api from 'virtual:api/CodeProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Examples } from '../../../site/Examples';
import { Example } from '../../../site/Example';
import Basic from './demo/Basic.tsx?demo';

export const meta = {
  title: 'Code 行内代码',
  description:
    '句子里的命令、文件名、标识符：等宽字体、浅底，长内容可以在任意位置换行。多行代码用 CodeBlock。',
  order: 10,
};

export default _component(() => () => (
  <DocPage wide meta={meta} imports="import { Code } from '@vue-tsx-pro/ui';">
    <Examples>
      <Example id="basic" title="基础用法" demo={Basic} />
    </Examples>
    <ApiReference api={api} />
  </DocPage>
));
