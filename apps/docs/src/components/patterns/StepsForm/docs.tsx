import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Code } from '@zerodep-dev/vue-tsx-pro-ui';
import api from 'virtual:api/StepsFormProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import Onboarding from './demo/Onboarding.tsx?demo';

export const meta = {
  title: 'StepsForm 分步表单',
  description:
    '一份表单分几步填：步骤条、这一步的字段、上一步 / 下一步 / 提交；下一步只校验这一步，提交没通过时跳回出错的步骤。',
  order: 5,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { StepsForm } from '@zerodep-dev/vue-tsx-pro-ui/patterns';"
  >
    <Example id="onboarding" title="供应商开户" demo={Onboarding}>
      整份是一个 <Code>useForm</Code>：<Code>steps</Code> 每一步写标题、<Code>fields</Code>
      （这一步的字段路径）与 <Code>content</Code>。“下一步”只校验这一步的字段（
      <Code>form.validate(fields)</Code>
      ），通过才往后走，没通过的错误立即显示；走过的步骤在步骤条上可以点回去。最后一步是“提交”：整份校验没通过时跳到第一个有错的步骤，那一步在步骤条上标成出错。换步后焦点移到这一步的内容上，读屏念出“第
      2 步，共 3 步”。<Code>_current</Code>{' '}
      可以双向绑定（提交成功后回到第一步）。只确认、不填的一步把 <Code>fields</Code> 写成空数组。
    </Example>
    <ApiReference api={api} />
  </DocPage>
));
