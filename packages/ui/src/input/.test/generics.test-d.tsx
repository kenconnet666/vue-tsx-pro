// 类型：泛型组件从 items / rows 推出节点的类型，取键、取文字、渲染函数的参数跟着它；写错字段时类型检查报错
import type { CalendarDate } from '@internationalized/date';
import { DatePicker } from '../../date/DatePicker';
import { DateField } from '../../date/DateField';
import { Tree } from '../../display/Tree';
import { VirtualList } from '../../display/VirtualList';
import { KanbanBoard } from '../../patterns/KanbanBoard';
import { DataTable } from '../../table/DataTable';
import { Autocomplete } from '../Autocomplete';
import { Cascader } from '../Cascader';
import { CheckboxGroup } from '../Checkbox';
import { Combobox } from '../Combobox';
import { Mentions } from '../Mentions';
import { RadioGroup } from '../Radio';
import { Select } from '../Select';
import { Slider } from '../Slider';
import { TagsInput } from '../TagsInput';
import { Transfer, TreeTransfer } from '../Transfer';
import { TreeSelect } from '../TreeSelect';

interface Region {
  code: string;
  name: string;
  children?: Region[];
}
declare const regions: Region[];
const accessors = {
  getKey: (region: Region) => region.code,
  getLabel: (region: Region) => region.name,
  getChildren: (region: Region) => region.children,
};

interface User {
  id: number;
  name: string;
}
declare const users: User[];

export const select = (
  <Select
    items={users}
    toOption={(user) => ({ value: String(user.id), label: user.name })}
    _value={null}
  />
);
export const selectTypo = (
  <Select
    items={users}
    // @ts-expect-error 选项是 User，没有 title
    toOption={(user) => ({ value: user.title, label: '' })}
  />
);
// @ts-expect-error 单选的值是字符串
export const selectValue = <Select items={['北京']} _value={1} />;

export const combobox = (
  <Combobox items={users} toOption={(user) => ({ value: String(user.id), label: user.name })} />
);

export const cascader = <Cascader items={regions} {...accessors} _value={['zj', 'hz']} />;
export const cascaderTypo = (
  <Cascader
    items={regions}
    {...accessors}
    // @ts-expect-error 节点是 Region，没有 id
    getKey={(region) => region.id}
  />
);

export const treeSelect = <TreeSelect items={regions} {...accessors} _value="hz" />;
export const tree = <Tree items={regions} {...accessors} aria-label="地区" />;
// @ts-expect-error 节点是 Region，没有 title
export const treeTypo = <Tree items={regions} {...accessors} getLabel={(region) => region.title} />;

export const checkboxes = <CheckboxGroup items={['甲', '乙']} _value={['甲']} />;
export const radios = <RadioGroup items={['甲', '乙']} _value="甲" />;

export const slider = <Slider _value={30} />;
export const range = <Slider _value={[10, 30]} />;

export const transfer = (
  <Transfer
    items={users}
    toOption={(user) => ({ value: String(user.id), label: user.name })}
    _value={['1']}
  />
);

export const kanban = (
  <KanbanBoard
    columns={[{ key: 'todo', label: '待办' }]}
    items={users}
    getKey={(user) => String(user.id)}
    getColumn={(user) => (user.id > 0 ? 'todo' : 'done')}
    onMove={(user, to) => void [user.name, to]}
  >
    {(user) => user.name}
  </KanbanBoard>
);

export const table = (
  <DataTable
    rows={users}
    columns={[{ key: 'name', header: '姓名', value: (user) => user.name }]}
    getKey={(user) => String(user.id)}
    aria-label="用户"
  />
);
// @ts-expect-error 行是 User，没有 email
export const tableTypo = <DataTable rows={users} columns={[]} getKey={(user) => user.email} />;

export const list = (
  <VirtualList items={users} getKey={(user) => user.id} aria-label="用户">
    {(user) => user.name}
  </VirtualList>
);

// 日期的值：默认是 ISO 字符串，valueType="dateValue" 时是 @internationalized/date 的对象
export const isoDate = <DateField _value="2026-11-07" />;
declare const day: CalendarDate;
export const dateValue = <DatePicker valueType="dateValue" _value={day} />;

// 文字输入加建议：建议是任意数据时给 toOption，类型从 items 推出来；不是 ListboxOption、字符串又没给 toOption 时报错
export const autocomplete = (
  <Autocomplete
    _value=""
    items={users}
    toOption={(user) => ({ value: user.name, label: user.name })}
  />
);
export const autocompleteMissing = (
  // @ts-expect-error 建议是 User，要给 toOption
  <Autocomplete _value="" items={users} />
);
export const tags = <TagsInput _value={['北京']} items={['北京', '上海']} />;
export const tagsData = (
  <TagsInput
    _value={[]}
    items={users}
    toOption={(user) => ({ value: String(user.id), label: user.name })}
  />
);
export const mentions = (
  <Mentions
    _value=""
    items={users}
    toOption={(user) => ({ value: String(user.id), label: user.name })}
  />
);
export const mentionsTypo = (
  <Mentions
    _value=""
    items={users}
    // @ts-expect-error 候选人是 User，没有 email
    toOption={(user) => ({ value: user.email, label: user.name })}
  />
);
export const treeTransfer = <TreeTransfer items={regions} {...accessors} _value={['hz']} />;
export const treeTransferTypo = (
  <TreeTransfer
    items={regions}
    {...accessors}
    // @ts-expect-error 节点是 Region，没有 label
    getLabel={(region) => region.label}
  />
);
