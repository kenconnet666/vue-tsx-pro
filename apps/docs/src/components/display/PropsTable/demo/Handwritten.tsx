// 给自己的组件手写 API 数据：名称、种类、类型、必填、默认值、可绑定、说明，档位类的列出每个可选值
import { _component } from '@vue-tsx-pro/tsx';
import { PropsTable, type ApiProp } from '@vue-tsx-pro/ui/docs-kit';

const props: ApiProp[] = [
  {
    name: 'value',
    kind: 'prop',
    type: 'number',
    required: false,
    bindable: true,
    default: '0',
    description: '当前评分，父级写 _value={_bind(score)}',
  },
  {
    name: 'count',
    kind: 'prop',
    type: 'number',
    required: false,
    default: '5',
    description: '星星的个数',
  },
  {
    name: 'size',
    kind: 'prop',
    type: "'sm' | 'md' | 'lg'",
    required: false,
    default: "'md'",
    description: '尺寸',
    values: [
      { value: 'sm', description: '表格、列表里' },
      { value: 'md', description: '表单里（默认）' },
      { value: 'lg', description: '详情页的总评分' },
    ],
  },
  {
    name: 'label',
    kind: 'prop',
    type: 'string',
    required: true,
    description: '评分的名称，读屏念的是它',
  },
];

// 外观属性同 Table：density 默认 compact，这里加了斑马纹
export default _component(() => () => <PropsTable props={props} caption="Rating 的属性" striped />);
