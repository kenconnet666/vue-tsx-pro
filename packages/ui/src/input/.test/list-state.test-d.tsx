// 类型：items 是 ListboxOption 时 toOption 可以不写，别的数据必须给 toOption；渲染函数拿到原始数据
import type { ListboxProps } from '../Listbox';
import type { SelectProps } from '../Select';

interface User {
  id: number;
  name: string;
}

export const plain: ListboxProps = { items: [{ value: 'a', label: 'A' }] };

export const mapped: SelectProps<User> = {
  items: [{ id: 1, name: '张三' }],
  toOption: (user) => ({ value: String(user.id), label: user.name }),
  children: (user) => user.name,
  renderValue: (users) => users.map((user) => user.name).join('、'),
};

// @ts-expect-error 不是 ListboxOption 的数据要给 toOption
export const missing: SelectProps<User> = { items: [{ id: 1, name: '张三' }] };

// @ts-expect-error 多选的 value 是数组
export const wrongValue: ListboxProps = { items: [], selectionMode: 'multiple', value: 'a' };
