/**
 * 搜索框（input type="search"）：TextField 加上搜索图标、清空按钮、默认的名称与占位文字（“搜索”），
 * 以及“要搜索了”的时机——停手一会儿、按回车、清空。
 *
 *   <SearchField _value={keyword} />                                     // 本地过滤：每敲一个字都用 keyword 过滤
 *   <SearchField _value={keyword} onSearch={(text) => query.reload({ keyword: text })} />   // 请求：停手 300ms、回车、清空才发
 *
 * - `_value` 每敲一个字都更新（输入框里的草稿）；`onSearch` 只在该查的时候调用，同一个词不重复调用。
 * - 回车、清空立即触发；打字等 `delay`（默认 300ms，0 是每次输入都触发）。
 * - 其余属性同 TextField（未声明的落到 input 上）：`size`、`variant`、`placeholder`、`aria-label`、`propsRoot`……
 *
 * 下拉、穿梭框、树、表头筛选里的搜索框都是它。
 */
import { Search } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { onScopeDispose, watch } from 'vue';
import { useLang } from '../config/context';
import { isComposingKey } from '../utils/dom/hotkeys';
import { mergePartProps } from '../utils/props';
import { TextField, type TextFieldProps } from './TextField';

/** 未声明的属性落到 input 上（同 TextField）；type 固定是 search */
export interface SearchFieldProps extends Omit<TextFieldProps, 'type'> {
  /** 输入框里的文字：父级写 _value={x}，每敲一个字都更新 */
  _value?: string;
  /** 要搜索了：停手 delay 毫秒、按回车、清空时调用（回车、清空立即）；和上一次相同的词不再调用 */
  onSearch?: (keyword: string) => void;
  /**
   * 停手多久调用 onSearch（毫秒）；0 是每次输入都调用
   * @default 300
   */
  delay?: number;
}

/** 搜索框：搜索图标、清空、停手或回车时触发搜索 */
export const SearchField = _component(
  ({ _value: value = _bindable(''), onSearch, delay = 300, ...rest }: SearchFieldProps) => {
    const lang = useLang();
    // 上一次交出去的词：一样的不再交
    let searched = _untrack(value);
    // 自己输入的最新的词：父级从外面改了值（重置、恢复保存的条件）时不是它，那次不触发搜索
    let typed = searched;
    let timer: ReturnType<typeof setTimeout> | undefined;
    onScopeDispose(() => clearTimeout(timer));

    function search() {
      clearTimeout(timer);
      if (value === searched) return;
      searched = value;
      onSearch?.(value);
    }

    function onInput(text: string) {
      typed = text;
      value = text;
      clearTimeout(timer);
      // 清空立即生效；打字等停手
      if (!text || delay <= 0) search();
      else timer = setTimeout(search, delay);
    }

    watch(
      () => value,
      (next) => {
        if (next === typed) return;
        clearTimeout(timer);
        typed = next;
        searched = next;
      },
    );

    return () => (
      <TextField
        {...mergePartProps<TextFieldProps>(
          {
            icon: Search,
            clearable: true,
            placeholder: lang.selectSearch,
            'aria-label': lang.selectSearch,
            enterkeyhint: 'search',
          },
          rest,
          {
            type: 'search',
            onKeydown: (event: KeyboardEvent) => {
              if (event.key === 'Enter' && !isComposingKey(event)) search();
            },
          },
        )}
        _value={value}
        onUpdate:_value={onInput}
      />
    );
  },
);
