import { _component } from '@vue-tsx-pro/tsx';
import { Code } from '@vue-tsx-pro/ui';
import formSectionApi from 'virtual:api/FormSectionProps';
import { ApiReference } from '../../../site/ApiReference';
import { DocPage } from '../../../site/DocPage';
import { Example } from '../../../site/Example';
import DmcEditor from './frames/DmcEditor.tsx?demo';

export const meta = {
  title: 'DMC Editor 降 DMC 编辑',
  description:
    '新建、编辑共用的长表单：字段与校验按降本项目信息表的 DMC 降本主表，实施节点按 DMC 降本实施节点信息表在表格里逐行编辑。',
  order: 4,
};

export default _component(() => () => (
  <DocPage
    wide
    meta={meta}
    imports="import { DatePicker, Form, FormSection, Table, TagsInput, useForm } from '@vue-tsx-pro/ui';"
  >
    <Example id="editor" title="降 DMC 编辑" demo={DmcEditor} frame="48rem">
      主表三组：基本信息（联络人工号由联络人带出）、降本信息（降本类型至少一种，选了哪种就填对应的预期收益；简要描述五项必写）、技术与实施（供应商件号可填多个、单个不超过
      100 字；完成年度按信息表存完整日期；是否需要 SB 默认否）。实施节点是 zod
      的数组字段：每行的完成形式、计划完成日期、责任一级团队必填，错误显示在对应的格子下面；新建时按
      ECP 批准、MI 批准、QSL 入册、实施给出模板，添加节点时责任团队跟主表。地址上带{' '}
      <Code>code</Code> 时编辑那一项，保存后去项目详情。
    </Example>
    <ApiReference api={formSectionApi} />
  </DocPage>
));
