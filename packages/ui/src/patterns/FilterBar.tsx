/**
 * 查询栏（form role="search"）：列表页上方的一排筛选条件，最后是“查询”“重置”；条件多时其余的收起来，点“展开”再显示。
 *
 *   <FilterBar onSearch={search} onReset={reset} more={<>…不常用的条件…</>} moreActive={2}>
 *     <Field label="项目名称"><TextField value={_bind(query.name)} /></Field>
 *     <Field label="任务类别"><Select … /></Field>
 *   </FilterBar>
 *
 * 条件排成栅格：每格不窄于 minFieldWidth，栅格多宽就放几格；按钮区在栅格的结束边，宽度随按钮、不折行，
 * 和条件的最后一行对齐（按钮再多也不会在一格里挤成两行）；容器太窄放不下时，按钮区整体换到下一行、靠结束边。
 * 默认标签在起始边、宽度随文字（labelWidth 为 auto：控件紧跟着标签，不留空白；要几行对齐时写固定宽度）。在输入框里按回车就是查询（原生表单提交）。
 * more 收起时不渲染；moreActive 是收起的条件里已经填了几项，显示在“展开”旁边，免得忘了还有条件生效。
 *
 * 部件：Root（form）、Fields（条件的栅格）、Field 们、More（收起的条件，display: contents）、Actions（div）、
 * Search、Reset（Button）、Toggle（展开收起的 Button）。
 */
import { ChevronDown } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { useId, type VNodeChild } from 'vue';
import { Badge } from '../base/Badge';
import { useMessages } from '../config/lang/messages';
import { patternsMessages } from './messages';
import { Button, type ButtonProps } from '../base/Button';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { disclosureStyles } from '../utils/style/transitions';
import { provideFieldLayout, type FieldLayout } from '../form/field-layout';

/** 角色与提交由组件管理 */
export type FilterBarManaged = 'role' | 'onSubmit' | 'onReset';

/** 未声明的属性落到 form 上 */
export interface FilterBarProps
  extends PartProps<'form', FilterBarManaged>, Pick<FieldLayout, 'labelPlacement' | 'labelWidth'> {
  /** 点“查询”或在输入框里按回车 */
  onSearch?: () => void;
  /** 点“重置”：清空条件由使用方做（通常 Object.assign 回初始值，再查询一次） */
  onReset?: () => void;
  /** 查询中：“查询”按钮显示加载中 */
  loading?: boolean;
  /** 不常用的条件：默认收起，点“展开”才显示 */
  more?: VNodeChild;
  /** 是否展开了 more：父级写 expanded={_bind(x)} */
  expanded?: boolean;
  /** 收起的条件里已经填了几项：大于 0 时显示在“展开”旁边 */
  moreActive?: number;
  /** 每个条件的最小宽度（CSS 长度），默认 `'16em'` */
  minFieldWidth?: string;
  /** 结束边额外的按钮：放在“重置”前面（如“导出筛选结果”） */
  actions?: VNodeChild;
  /** 条件栅格的部件属性 */
  propsFields?: PartProps<'div'>;
  /** 按钮区的部件属性 */
  propsActions?: PartProps<'div'>;
  /** 查询按钮的部件属性 */
  propsSearch?: Partial<ButtonProps>;
  /** 重置按钮的部件属性 */
  propsReset?: Partial<ButtonProps>;
  /** 展开收起按钮的部件属性 */
  propsToggle?: Partial<ButtonProps>;
  /** 收起的条件的外层（display: contents）的部件属性 */
  propsMore?: PartProps<'div'>;
  /** 常用的条件：Field */
  children?: VNodeChild;
}

/** FilterBar 的样式：root、fields、more、actions、toggleIconOpen */
export const filterBarStyles = stylex.create({
  // 条件栅格与按钮区并排；放不下时按钮区换行
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    columnGap: '_xl',
    rowGap: '_md',
  },
  fields: {
    display: 'grid',
    columnGap: '_xl',
    rowGap: '_md',
    alignItems: 'start',
    flexGrow: 1,
    minWidth: 0,
  },
  // 收起的条件直接是栅格的格子
  more: { display: 'contents' },
  // 宽度随按钮、不折行；换到下一行时也靠结束边
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    flexShrink: 0,
    marginInlineStart: 'auto',
  },
  // 展开后箭头朝上
  toggleIconOpen: { rotate: '180deg' },
});

/** FilterBar 的样式：columns（每格的最小宽度；栅格本身至少放得下一格） */
export const filterBarColumnStyles = stylex.create({
  columns: (minWidth: string) => ({
    flexBasis: minWidth,
    gridTemplateColumns: `repeat(auto-fill, minmax(min(${minWidth}, 100%), 1fr))`,
  }),
});

/** 查询栏：筛选条件的栅格，查询、重置，不常用的条件可以展开收起 */
export const FilterBar = _component(
  ({
    onSearch,
    onReset,
    loading = false,
    more,
    expanded = _bindable(false),
    moreActive = 0,
    minFieldWidth = '16em',
    actions,
    labelPlacement = 'start',
    labelWidth = 'auto',
    propsFields,
    propsActions,
    propsSearch,
    propsReset,
    propsToggle,
    propsMore,
    children,
    ...rest
  }: FilterBarProps) => {
    const messages = useMessages('patterns', patternsMessages);
    const moreId = useId();
    provideFieldLayout(() => ({ labelPlacement, labelWidth }));

    function onSubmit(event: Event) {
      event.preventDefault();
      onSearch?.();
    }

    return () => (
      <form
        {...mergeAttrs<'form'>({ sx: filterBarStyles.root }, rest, { role: 'search', onSubmit })}
        data-expanded={more != null ? expanded : undefined}
      >
        <div
          {...mergeAttrs<'div'>(
            { sx: [filterBarStyles.fields, filterBarColumnStyles.columns(minFieldWidth)] },
            propsFields,
          )}
        >
          {children}
          {more != null && expanded && (
            <div {...mergeAttrs<'div'>({ sx: filterBarStyles.more }, propsMore, { id: moreId })}>
              {more}
            </div>
          )}
        </div>
        <div {...mergeAttrs<'div'>({ sx: filterBarStyles.actions }, propsActions)}>
          {more != null && (
            <Button
              {...mergePartProps<ButtonProps>(
                {
                  variant: 'ghost',
                  tone: 'neutral',
                  iconEnd: ChevronDown,
                  propsIconEnd: {
                    sx: [disclosureStyles.icon, expanded && filterBarStyles.toggleIconOpen],
                  },
                },
                propsToggle,
                {
                  type: 'button',
                  'aria-expanded': expanded,
                  'aria-controls': expanded ? moreId : undefined,
                  onClick: () => (expanded = !expanded),
                },
              )}
            >
              {expanded ? messages.filterCollapse : messages.filterExpand}
              {!expanded && moreActive > 0 && (
                <Badge tone="accent" radius="full">
                  {messages.filterActive(moreActive)}
                </Badge>
              )}
            </Button>
          )}
          {actions}
          <Button
            {...mergePartProps<ButtonProps>({ variant: 'outline', tone: 'neutral' }, propsReset, {
              type: 'button',
              onClick: () => onReset?.(),
            })}
          >
            {messages.filterReset}
          </Button>
          <Button {...mergePartProps<ButtonProps>({ loading }, propsSearch, { type: 'submit' })}>
            {messages.filterSearch}
          </Button>
        </div>
      </form>
    );
  },
);
