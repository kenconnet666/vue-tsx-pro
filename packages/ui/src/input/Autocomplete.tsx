/**
 * 自动完成：值就是输入框里的文字，列表只是建议（邮箱后缀、常用地址、搜索历史、供应商名称）。
 * 选一项等于把它的文字填进来；不选也行，输入什么就是什么。要从固定的选项里选一个（值是选项的 value）时用 Combobox。
 *
 *   <Field label="邮箱"><Autocomplete value={_bind(email)} items={suggestions(email)} filter={false} /></Field>
 *   <Autocomplete value={_bind(keyword)} load={(text, signal) => api.suggest(text, { signal })} aria-label="搜索" />
 *
 * 建在 Combobox 上（allowCustomValue、不显示展开按钮）：没有可选的建议时不弹出列表；↓ 打开建议，↑↓ 移动，
 * Enter 填入，Esc 关闭（关闭时再按 Esc 清空）。写了 name 时表单提交的是输入框里的文字。
 * 部件同 Combobox：Root（外壳）、Input（主元素）、Clear、Popover、Listbox。
 */
import { _component } from '@vue-tsx-pro/tsx';
import { Combobox, type ComboboxBaseProps, type ComboboxProps } from './Combobox';
import { FormValue } from '../form/FormValue';
import type { ListboxOption, OptionMapping } from './list-state';
import type { OptionsLoader } from './remote-items';

/** 未声明的属性落到 input 上；选项、过滤、远程建议、外观同 Combobox */
export type AutocompleteProps<T = ListboxOption> = Omit<
  ComboboxBaseProps<T>,
  'value' | 'inputValue' | 'allowCustomValue' | 'showToggle' | 'hideEmpty' | 'items' | 'load'
> &
  OptionMapping<T> & {
    /** 输入框里的文字：父级写 value={_bind(x)}；选一项建议就是把它的文字填进来 */
    value?: string;
    /** 建议：ListboxOption、字符串，或任意数据加 toOption（直接写在这里，数据的类型才能从它推出来） */
    items?: readonly T[];
    /** 远程建议：输入停下 300 ms 后按输入调用，结果代替 items；只采用最后一次 */
    load?: OptionsLoader<T>;
  };

/** 自动完成：带建议的输入框，值就是文字 */
export const Autocomplete = _component(
  <T,>({ value = _bindable(''), name, ...rest }: AutocompleteProps<T>) =>
    () => (
      <>
        <Combobox
          {...(rest as ComboboxProps<T>)}
          inputValue={_bind(value)}
          allowCustomValue
          showToggle={false}
          hideEmpty
        />
        <FormValue name={name} value={value || null} disabled={rest.disabled} />
      </>
    ),
);
