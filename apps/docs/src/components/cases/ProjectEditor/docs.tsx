import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import actionBarApi from 'virtual:api/ActionBarProps';
import formSectionApi from 'virtual:api/FormSectionProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import ProjectEditor from './frames/ProjectEditor.tsx?demo';

export const meta = {
  title: 'Project Editor 降本项目编辑',
  description:
    '联合降本管理的长表单：五组字段、两列、标签在左侧，条件必填、选人带出工号、按万元输入金额，底部的操作栏吸在窗口底边。',
  order: 1,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ActionBar, Form, FormSection, GridItem, useForm } from '@vue-tsx-pro/ui';"
  >
    <Example id="editor" title="编辑单机降本项目" demo={ProjectEditor} frame="48rem">
      字段来自降本项目信息表的单机降本主表（机型、单位、人员都是虚构的）。<Code>Form</Code> 上写{' '}
      <Code>labelPlacement="start"</Code>，标签一列右对齐、按第一行文字的基线对齐；
      <Code>FormSection</Code> 按主题分组，<Code>columns={'{2}'}</Code>{' '}
      最多两列、窗口窄了自动变成一列，长的字段用 <Code>GridItem span="full"</Code>{' '}
      占满一行；“经费及项目依据”可以收起。选了哪种降本类型，对应的金额才必填（zod 的 superRefine
      校验，Field 的 <Code>required</Code> 跟着变）；单机降本以元保存、按万元输入。底部的{' '}
      <Code>ActionBar</Code>{' '}
      贴在窗口底边，盖着下面的内容时带阴影；提交没通过时左边提示还有几项要处理，焦点移到第一个出错的控件。
    </Example>
    <ApiReference api={[formSectionApi, actionBarApi]} />
  </DocPage>
));
