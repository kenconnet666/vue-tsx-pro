/**
 * 每页条数选择：分页的配套组件，与 Pagination 并排放（各自独立，按需组合；三样都要时用 PaginationBar）。选项文字取语言包（“20 条/页”）。
 *
 *   <Flex gap="md" align="center">
 *     <Pagination _page={page} total={total} pageSize={size} />
 *     <PageSizeSelect _value={size} onSizeChange={() => (page = 1)} />
 *   </Flex>
 *
 * 基于 Select：未声明的属性落到 Select 上（外壳用 propsRoot 等 Select 的部件），名称默认取语言包（每页条数）。
 * 按钮按最长的选项定宽：换条数时不变宽窄，下拉（与按钮同宽）里的选项也不被截断。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { watch } from 'vue';
import { useLang } from '../config/context';
import { Select, type SelectProps } from '../input/Select';
import { mergePartProps } from '../utils/props';
import type { SingleSelectionProps } from '../utils/data/selection';

/** 单选的 Select 属性 */
type SingleSelectProps = Extract<SelectProps, SingleSelectionProps>;

/** 未声明的属性落到 Select 上 */
export interface PageSizeSelectProps extends Omit<
  Partial<SelectProps>,
  '_value' | 'items' | 'selectionMode'
> {
  /** 每页条数：父级写 _value={size} */
  _value?: number;
  /** 可选的条数，默认 [10, 20, 50, 100] */
  options?: readonly number[];
  /** 用户换了条数后调用（通常把页码回到第 1 页） */
  onSizeChange?: (size: number) => void;
}

/** PageSizeSelect 的样式：stack、option、hidden */
export const pageSizeSelectStyles = css.create({
  // 所有选项的文字叠在同一格，按最宽的那个撑开，只显示选中的
  stack: { display: 'inline-grid' },
  option: { gridArea: '1 / 1' },
  hidden: { visibility: 'hidden' },
});

/** 每页条数选择（Select） */
export const PageSizeSelect = _component(
  ({
    _value: value = _bindable(10),
    options = [10, 20, 50, 100],
    onSizeChange,
    ...rest
  }: PageSizeSelectProps) => {
    const lang = useLang();
    // Select 的值是字符串：本地一份，与数字的 value 互相同步
    let selected = _state(String(_untrack(value)));
    watch(
      () => value,
      (size) => (selected = String(size)),
    );
    watch(
      () => selected,
      (next) => {
        const size = Number(next);
        if (size === value) return;
        value = size;
        onSizeChange?.(size);
      },
    );

    return () => (
      <Select
        {...mergePartProps<SingleSelectProps>(
          {
            items: options.map((size) => ({
              value: String(size),
              label: lang.pageSizeOption(size),
            })),
            selectionMode: 'single',
            'aria-label': lang.pageSizeLabel,
            size: 'sm',
            renderValue: () => (
              <span {...css.attrs(pageSizeSelectStyles.stack)}>
                {options.map((size) => (
                  <span
                    key={size}
                    aria-hidden={size !== value || undefined}
                    {...css.attrs(
                      pageSizeSelectStyles.option,
                      size !== value && pageSizeSelectStyles.hidden,
                    )}
                  >
                    {lang.pageSizeOption(size)}
                  </span>
                ))}
              </span>
            ),
          },
          rest,
        )}
        _value={selected}
      />
    );
  },
);
