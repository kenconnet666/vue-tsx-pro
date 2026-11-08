// 表单设计器（flow-ts-ui 的 FormDesigner）：改的就是字段清单——流程工程里 form.ts 的 defineForm 字面量；
// 下面的代码框随时显示当前的清单。成本中心的选项来自登记的字典，人员字段从组织架构里选（Provider 的 formSources）
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { CodeBlock, Flex, localPeopleSource, Provider } from '@zerodep-dev/vue-tsx-pro-ui';
import type { FormManifest } from '@zerodep-dev/flow-ts-model';
import { FormDesigner } from '@zerodep-dev/flow-ts-ui';
import { org, roles } from '../../../input/PeoplePicker/demo/org';

const sources = {
  options: {
    costCenters: [
      { value: 'rd', label: '研发中心' },
      { value: 'mfg', label: '制造部' },
    ],
  },
  people: localPeopleSource(org, roles),
};

export default _component(() => {
  let manifest = _state<FormManifest>({
    reason: { label: '事由', type: 'text', required: true, maxLength: 200 },
    kind: {
      label: '费用类型',
      type: 'select',
      required: true,
      options: [
        { value: 'travel', label: '差旅' },
        { value: 'meal', label: '招待' },
      ],
    },
    guests: {
      label: '招待人数',
      type: 'number',
      integer: true,
      visibleWhen: { field: 'form.kind', op: 'eq', value: 'meal' },
    },
    center: { label: '成本中心', type: 'select', options: { source: 'costCenters' } },
    handler: { label: '经办人', type: 'people', max: 1 },
    lines: {
      label: '明细',
      type: 'list',
      fields: {
        item: { label: '项目', type: 'text' },
        cost: { label: '金额', type: 'decimal', scale: 2 },
      },
    },
  });
  return () => (
    <Provider formSources={sources}>
      <Flex direction="column" gap="md">
        <FormDesigner
          manifest={manifest}
          onChange={(next) => (manifest = next)}
          sources={Object.keys(sources.options)}
        />
        <CodeBlock
          lang="ts"
          code={`export default defineForm(${JSON.stringify(manifest, null, 2)});`}
        />
      </Flex>
    </Provider>
  );
});
