// 采购申请：选项、人员、上传都来自登记的数据来源（应用里在 createUi 的 formSources 登记一次，这里用 Provider 局部给）：
// 成本中心是字典（固定的列表），供应商按搜索词远程取，经办人从组织架构里选，附件交给上传函数。字段的 meta 只写名字
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  emptyValues,
  localPeopleSource,
  Provider,
  SchemaForm,
  useForm,
  type FormSources,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { z } from 'zod';
import { org, roles } from '../../../input/PeoplePicker/demo/org';

const SUPPLIERS = ['华东钢材', '华南电子', '北方塑胶', '西部线缆', '东海标准件', '中原包装'];

const sources: FormSources = {
  options: {
    costCenters: [
      { value: 'rd', label: '研发中心' },
      { value: 'mfg', label: '制造部' },
      { value: 'sales', label: '销售部' },
    ],
    // 远程搜索：真实应用里是请求（signal 用来取消被顶掉的那次）
    suppliers: async (query) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return SUPPLIERS.filter((name) => name.includes(query)).map((name) => ({
        value: name,
        label: name,
      }));
    },
  },
  people: localPeopleSource(org, roles),
  // 上传：真实应用里传到文件服务，返回的结果记在文件上
  upload: async (file, { onProgress }) => {
    for (let step = 1; step <= 4; step++) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      onProgress(step / 4);
    }
    return { url: `/files/${file.name}` };
  },
};

const schema = z.object({
  title: z.string().min(1, '请填写标题').meta({ title: '标题', span: 'full' }),
  costCenter: z.string('请选择成本中心').meta({ title: '成本中心', source: 'costCenters' }),
  supplier: z
    .string('请选择供应商')
    .meta({ title: '供应商', source: 'suppliers', placeholder: '输入名称搜索' }),
  handler: z.array(z.unknown()).min(1, '请选择经办人').meta({ title: '经办人', control: 'people' }),
  files: z.array(z.unknown()).meta({ title: '附件', control: 'file', span: 'full' }),
});

export default _component(() => {
  let result = _state('');
  const form = useForm({
    schema,
    initial: emptyValues(schema),
    onSubmit: (values) => {
      result = `已提交：${values.title}`;
    },
  });
  return () => (
    <Provider formSources={sources}>
      <SchemaForm controller={form} columns={2}>
        {result}
      </SchemaForm>
    </Provider>
  );
});
