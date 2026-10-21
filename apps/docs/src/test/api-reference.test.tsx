// API 小节：标题与说明先渲染（本页目录、锚点照常），表格在首帧之后空闲时一张一张补上，最终全部出现
import { _component } from '@vue-tsx-pro/tsx';
import type { ComponentApi } from '@vue-tsx-pro/ui/docs-kit';
import { expect, it, vi } from 'vitest';
import { ApiReference } from '../site/ApiReference';
import { mount } from './mount';

const prop = (name: string, kind: 'prop' | 'event'): ComponentApi['props'][number] => ({
  name,
  kind,
  type: 'string',
  required: false,
  description: name,
});
const apis: ComponentApi[] = [
  {
    name: 'SelectProps',
    component: 'Select',
    description: '下拉选择',
    props: [prop('value', 'prop'), prop('onChange', 'event')],
  },
  { name: 'ListboxProps', component: 'Listbox', description: '', props: [prop('items', 'prop')] },
];

it('标题先渲染，表格随后全部补上（各组件的表格按顺序出现）', async () => {
  const host = mount(_component(() => () => <ApiReference api={apis} />));
  expect(host.querySelector('#api')).not.toBeNull();
  expect(host.querySelector('#api-SelectProps')).not.toBeNull();
  expect(host.querySelectorAll('table')).toHaveLength(0);
  await vi.waitFor(() => expect(host.querySelectorAll('table')).toHaveLength(3));
  const captions = [...host.querySelectorAll('caption')].map((caption) => caption.textContent);
  expect(captions).toEqual(['属性', '事件', '属性']);
});
