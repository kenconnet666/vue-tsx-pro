/**
 * 跳页：分页的配套组件，“跳至 [  ] 页”，回车或失焦后跳过去（夹在 1–pageCount），输入框随后清空。
 *
 *   <PageJump page={_bind(page)} pageCount={32} />
 *
 * 基于 NumberField：未声明的属性落到外层 div 上；输入框用 propsInput。读屏念输入框的名称（语言包的“跳到第几页”），
 * 前后的“跳至”“页”只是视觉上的提示。部件：Root（div）、Before、Input（NumberField）、After。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { watch } from 'vue';
import { useLang } from '../config/context';
import { NumberField, type NumberFieldProps } from '../input/NumberField';
import { clamp } from '../utils/data/layout';
import { elementProps, mergePartProps, mergeProps, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';

/** 未声明的属性落到外层 div 上 */
export interface PageJumpProps extends PartProps<'div'> {
  /** 当前页：父级写 page={_bind(page)}，跳页时写回 */
  page?: number;
  /** 总页数：输入的页码夹在 1–pageCount */
  pageCount: number;
  /** 字号档位，默认 sm（同 Pagination） */
  size?: TextSize;
  /** 输入框前文字的部件属性 */
  propsBefore?: PartProps<'span'>;
  /** 输入框（NumberField）的部件属性 */
  propsInput?: Partial<NumberFieldProps>;
  /** 输入框后文字的部件属性 */
  propsAfter?: PartProps<'span'>;
}

/** PageJump 的样式：root、input、text */
export const pageJumpStyles = stylex.create({
  root: { display: 'inline-flex', alignItems: 'center', gap: '_sm' },
  input: { width: '4.5em' },
  text: { color: '_textMuted', whiteSpace: 'nowrap' },
});

/** 跳页：输入页码后跳过去 */
export const PageJump = _component(
  ({
    page = _bindable(1),
    pageCount,
    size = 'sm',
    propsBefore,
    propsInput,
    propsAfter,
    ...rest
  }: PageJumpProps) => {
    const lang = useLang();
    // 输入框只在跳之前暂存页码，跳完清空
    let draft = _state<number | null>(null);
    watch(
      () => draft,
      (target) => {
        if (target == null) return;
        const next = clamp(Math.round(target), 1, Math.max(1, pageCount));
        if (next !== page) page = next;
        draft = null;
      },
    );

    return () => (
      <div
        {...elementProps(
          mergeProps<'div'>({ sx: [pageJumpStyles.root, fontSizeStyles[size]] }, rest),
        )}
      >
        {lang.pageJumpBefore && (
          <span
            {...elementProps(
              mergeProps<'span'>({ sx: pageJumpStyles.text, 'aria-hidden': true }, propsBefore),
            )}
          >
            {lang.pageJumpBefore}
          </span>
        )}
        <NumberField
          {...mergePartProps<NumberFieldProps>(
            {
              'aria-label': lang.pageJumpLabel,
              min: 1,
              max: Math.max(1, pageCount),
              stepper: false,
              propsRoot: { sx: pageJumpStyles.input },
            },
            propsInput,
          )}
          value={_bind(draft)}
        />
        {lang.pageJumpAfter && (
          <span
            {...elementProps(
              mergeProps<'span'>({ sx: pageJumpStyles.text, 'aria-hidden': true }, propsAfter),
            )}
          >
            {lang.pageJumpAfter}
          </span>
        )}
      </div>
    );
  },
);
