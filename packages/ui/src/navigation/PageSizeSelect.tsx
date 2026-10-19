/**
 * 每页条数选择：分页的配套组件，与 Pagination 并排放（各自独立，按需组合）。选项文字取语言包（“20 条/页”）。
 *
 *   <Flex gap="md" align="center">
 *     <Pagination page={_bind(page)} total={total} pageSize={size} />
 *     <PageSizeSelect value={_bind(size)} onUpdate={() => (page = 1)} />
 *   </Flex>
 *
 * 基于 Select：未声明的属性落到 Select 上（外壳用 propsRoot 等 Select 的部件），名称默认取语言包（每页条数）。
 */
import { _component } from '@vue-tsx-pro/tsx';
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
  'value' | 'items' | 'selectionMode' | 'onUpdate'
> {
  /** 每页条数：父级写 value={_bind(size)} */
  value?: number;
  /** 可选的条数，默认 [10, 20, 50, 100] */
  options?: readonly number[];
  /** 用户换了条数后调用（通常把页码回到第 1 页） */
  onUpdate?: (size: number) => void;
}

/** 每页条数选择（Select） */
export const PageSizeSelect = _component(
  ({
    value = _bindable(10),
    options = [10, 20, 50, 100],
    onUpdate,
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
        onUpdate?.(size);
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
          },
          rest,
        )}
        value={_bind(selected)}
      />
    );
  },
);
