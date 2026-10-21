import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import actionBarApi from 'virtual:api/ActionBarProps';
import formSectionApi from 'virtual:api/FormSectionProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import UnitEditor from './frames/UnitEditor.tsx?demo';

export const meta = {
  title: 'Unit Editor 单机降本编辑',
  description:
    '新建、编辑共用的长表单：字段与校验按降本项目信息表的单机降本主表，明细按单机降本明细表（零件更改、系统计算的费用与收益、工程评估）。',
  order: 3,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { ActionBar, Dialog, Form, FormSection, useForm } from '@vue-tsx-pro/ui';"
  >
    <Example id="editor" title="单机降本编辑" demo={UnitEditor} frame="48rem">
      主表四组：基本信息（提出部门属于提出单位，换单位时清空；联络人工号由联络人带出）、降本信息（选了哪种降本类型就要填对应的预期收益，zod
      的 superRefine 校验）、技术与实施（数模编号按“编号 +
      版本”校验）、经费与依据。明细按单机降本明细表：构型通知单编号可填多个；零件更改在{' '}
      <Code>Dialog</Code>{' '}
      里分更改前、更改后两栏填写，单件材料费、工时费、单件价格、单机价格与各项收益由系统算出，表格合计单机零件收益；工程评估的意见不是“初步同意”时原因必填。地址上带{' '}
      <Code>code</Code> 时编辑那一项，保存后去项目详情。
    </Example>
    <ApiReference api={[formSectionApi, actionBarApi]} />
  </DocPage>
));
