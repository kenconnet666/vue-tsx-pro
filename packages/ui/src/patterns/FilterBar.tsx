/**
 * 查询栏（form role="search"）：列表页上方的一排筛选条件，最后是“查询”“重置”；条件多时其余的收起来，点“展开”再显示。
 *
 *   <FilterBar onSearch={search} onReset={reset} more={<>…不常用的条件…</>} moreActive={2}>
 *     <Field label="项目名称"><TextField _value={query.name} /></Field>
 *     <Field label="任务类别"><Select … /></Field>
 *   </FilterBar>
 *
 * 条件排成栅格：每格不窄于 minFieldWidth，栅格多宽就放几格；按钮区在栅格的结束边，宽度随按钮、不折行，
 * 和条件的最后一行对齐（按钮再多也不会在一格里挤成两行）；容器太窄放不下时，按钮区整体换到下一行、靠结束边。
 * 默认标签在起始边、宽度随文字（labelWidth 为 auto：控件紧跟着标签，不留空白；要几行对齐时写固定宽度）。在输入框里按回车就是查询（原生表单提交）。
 * more 收起时不渲染；moreActive 是收起的条件里已经填了几项，显示在“展开”旁边，免得忘了还有条件生效。
 *
 * 高级筛选：给了 conditionFields 时按钮区多一个“高级筛选”，展开后在查询栏下面用 ConditionBuilder 编辑条件树（_condition），
 * 能表达固定条件表达不了的组合（任一满足、介于、不包含）；收起时有条件就在下面写成一句话，带“清空”。
 * “重置”同时把条件清成 null。条件是纯 JSON：交给后端（query 的条件树转 SQL）或前端 matchesCondition 筛。
 *
 *   <FilterBar onSearch={search} onReset={reset} conditionFields={fields} _condition={condition}>…</FilterBar>
 *
 * 部件：Root（form）、Fields（条件的栅格）、Field 们、More（收起的条件，display: contents）、Actions（div）、
 * Search、Reset（Button）、Toggle（展开收起的 Button）、AdvancedToggle（高级筛选的 Button）、Advanced（条件构造器那一行）。
 */
import { ChevronDown, ListFilter } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, type VNodeChild } from 'vue';
import { Badge } from '../base/Badge';
import { Small } from '../base/Text';
import { useLang } from '../config/context';
import { useMessages } from '../config/lang/messages';
import {
  describeCondition,
  isConditionGroup,
  type Condition,
  type ConditionField,
} from '../input/condition';
import { ConditionBuilder, type ConditionBuilderProps } from '../input/ConditionBuilder';
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
  /** 是否展开了 more：父级写 _expanded={x} */
  _expanded?: boolean;
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
  /** 高级筛选的字段：给了时按钮区多一个“高级筛选” */
  conditionFields?: readonly ConditionField[];
  /** 高级筛选的条件：父级写 _condition={condition}；没有时是 null，“重置”时清成 null */
  _condition?: Condition | null;
  /** 高级筛选按钮的部件属性 */
  propsAdvancedToggle?: Partial<ButtonProps>;
  /** 高级筛选那一行（条件构造器）的部件属性 */
  propsAdvanced?: Partial<ConditionBuilderProps>;
  /** 常用的条件：Field */
  children?: VNodeChild;
}

/** FilterBar 的样式：root、fields、more、actions、toggleIconOpen */
export const filterBarStyles = css.create({
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
  // 高级筛选与它的摘要各占一整行，排在条件与按钮下面
  advanced: {
    flexBasis: '100%',
    padding: '_md',
    backgroundColor: '_surfaceMuted',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
  },
  summary: { flexBasis: '100%', display: 'flex', alignItems: 'baseline', gap: '_sm', minWidth: 0 },
});

/** FilterBar 的样式：columns（每格的最小宽度；栅格本身至少放得下一格） */
export const filterBarColumnStyles = css.create({
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
    _expanded: expanded = _bindable(false),
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
    conditionFields,
    _condition: condition = _bindable<Condition | null>(null),
    propsAdvancedToggle,
    propsAdvanced,
    children,
    ...rest
  }: FilterBarProps) => {
    const messages = useMessages('patterns', patternsMessages);
    const lang = useLang();
    const moreId = useId();
    const advancedId = useId();
    let advancedOpen = _state(false);

    /** 条件里有几条比较（按钮旁的计数） */
    const countRules = (item: Condition): number =>
      !isConditionGroup(item)
        ? 1
        : 'not' in item
          ? countRules(item.not)
          : ('all' in item ? item.all : item.any).reduce(
              (sum, child) => sum + countRules(child),
              0,
            );
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
          {conditionFields && (
            <Button
              {...mergePartProps<ButtonProps>(
                { variant: 'ghost', tone: 'neutral', icon: ListFilter },
                propsAdvancedToggle,
                {
                  type: 'button',
                  'aria-expanded': advancedOpen,
                  'aria-controls': advancedOpen ? advancedId : undefined,
                  onClick: () => (advancedOpen = !advancedOpen),
                },
              )}
            >
              {messages.filterAdvanced}
              {!advancedOpen && condition && (
                <Badge tone="accent" radius="full">
                  {messages.filterActive(countRules(condition))}
                </Badge>
              )}
            </Button>
          )}
          {actions}
          <Button
            {...mergePartProps<ButtonProps>({ variant: 'outline', tone: 'neutral' }, propsReset, {
              type: 'button',
              onClick: () => {
                if (conditionFields) condition = null;
                onReset?.();
              },
            })}
          >
            {messages.filterReset}
          </Button>
          <Button {...mergePartProps<ButtonProps>({ loading }, propsSearch, { type: 'submit' })}>
            {messages.filterSearch}
          </Button>
        </div>
        {conditionFields && advancedOpen && (
          <ConditionBuilder
            {...mergePartProps<ConditionBuilderProps>(
              {
                fields: conditionFields,
                sx: filterBarStyles.advanced,
                'aria-label': messages.filterAdvanced,
              },
              propsAdvanced,
              { id: advancedId },
            )}
            _value={condition}
          />
        )}
        {conditionFields && !advancedOpen && condition && (
          <div {...css.attrs(filterBarStyles.summary)}>
            <Small tone="muted">
              {messages.filterAdvanced}：{describeCondition(condition, conditionFields, lang)}
            </Small>
            <Button variant="link" size="sm" type="button" onClick={() => (condition = null)}>
              {lang.clear}
            </Button>
          </div>
        )}
      </form>
    );
  },
);
