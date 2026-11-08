/**
 * 查询栏（form role="search"）：列表页上方的一排筛选条件，最后是“查询”“重置”；条件多时其余的收起来，点“展开”再显示。
 *
 *   <FilterBar onSearch={search} onReset={reset} more={<>…不常用的条件…</>} moreActive={2}>
 *     <Field label="项目名称"><TextField _value={query.name} /></Field>
 *     <Field label="任务类别"><Select … /></Field>
 *   </FilterBar>
 *
 * 第一排：start（QueryTable 的标题）、常用的条件、按钮区。按钮全在这一排的结束边，宽度随按钮；按剩下的宽度量出放得下几个条件
 * （每个不窄于 minFieldWidth），这几个铺满第一排，不留空。连 more 的条件一起都放得下时全部铺在第一排、不出“展开”
 * （展开只有多出一排时才有意义）；放不下的常用条件与展开的条件（more）一起从第二排起，列宽与第一排的每格相同、上下对齐；
 * more 收起时不渲染。窄到第一排一个条件也放不下时，条件在上、按钮区整体换到下面一行。
 * 按钮区依次是展开、高级筛选、actions、重置、查询，再是 end（QueryTable 的工具栏按钮）。
 * moreActive 是收起的条件里已经填了几项，显示在“展开”旁边，免得忘了还有条件生效。
 * 默认标签在起始边、宽度随文字（labelWidth 为 auto：控件紧跟着标签，不留空白；要几行对齐时写固定宽度）。在输入框里按回车就是查询（原生表单提交）。
 *
 * 高级筛选：给了 conditionFields 时按钮区多一个“高级筛选”，展开后在查询栏下面用 ConditionBuilder 编辑条件树（_condition），
 * 能表达固定条件表达不了的组合（任一满足、介于、不包含）；收起时有条件就在下面写成一句话，带“清空”。
 * “重置”同时把条件清成 null。条件是纯 JSON：交给后端（query 的条件树转 SQL）或前端 matchesCondition 筛。
 *
 *   <FilterBar onSearch={search} onReset={reset} conditionFields={fields} _condition={condition}>…</FilterBar>
 *
 * 部件：Root（form）、Start、Body（start 右边那一列）、Row（第一排）、Fields（第一排的条件）、Field 们、Actions（按钮区）、
 * More（第二排起的条件：第一排放不下的与展开的）、
 * Search、Reset（Button）、Toggle（展开收起的 Button）、AdvancedToggle（高级筛选的 Button）、Advanced（条件构造器那一行）。
 */
import { ChevronDown, ListFilter } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { useId, type VNodeChild } from 'vue';
import { Badge } from '../base/Badge';
import { Small } from '../base/Text';
import { useComponent } from '../config/components';
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
import { childNodes } from '../utils/data/text';
import { lengthToPx } from '../utils/dom/length';
import { useResizeObserver } from '../utils/dom/resize';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { disclosureStyles } from '../utils/style/transitions';
import { t } from '../config/theme/tokens';
import { provideFieldLayout, type FieldLayout } from '../form/field-layout';

/** 角色与提交由组件管理 */
export type FilterBarManaged = 'role' | 'onSubmit' | 'onReset';

/** FilterBar 的档位（createUi / Provider 的 components.FilterBar.defaults：全站查询栏的标签位置、条件宽度） */
export interface FilterBarOptions extends Pick<FieldLayout, 'labelPlacement' | 'labelWidth'> {
  /** 每个条件的最小宽度（CSS 长度），默认 `'14em'` */
  minFieldWidth?: string;
}

/** 未声明的属性落到 form 上 */
export interface FilterBarProps extends PartProps<'form', FilterBarManaged>, FilterBarOptions {
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
  /** 按钮区额外的按钮：放在“重置”前面（如“导出筛选结果”） */
  actions?: VNodeChild;
  /** 第一排起始边的内容：在条件前面（QueryTable 的标题） */
  start?: VNodeChild;
  /** 按钮区最后的内容：在“查询”后面、隔一条竖线（QueryTable 的工具栏按钮） */
  end?: VNodeChild;
  /** start 右边那一列（第一排、展开的条件、高级筛选）的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 第一排（条件与按钮区）的部件属性 */
  propsRow?: PartProps<'div'>;
  /** start 外层的部件属性 */
  propsStart?: PartProps<'div'>;
  /** 常用条件的栅格的部件属性 */
  propsFields?: PartProps<'div'>;
  /** 按钮区的部件属性 */
  propsActions?: PartProps<'div'>;
  /** 查询按钮的部件属性 */
  propsSearch?: Partial<ButtonProps>;
  /** 重置按钮的部件属性 */
  propsReset?: Partial<ButtonProps>;
  /** 展开收起按钮的部件属性 */
  propsToggle?: Partial<ButtonProps>;
  /** 展开的条件的栅格的部件属性 */
  propsMore?: PartProps<'div'>;
  /** 高级筛选的字段：给了时按钮区多一个“高级筛选” */
  conditionFields?: readonly ConditionField[];
  /** 高级筛选的条件：父级写 _condition={condition}；没有时是 null，“重置”时清成 null */
  _condition?: Condition | null;
  /** 高级筛选按钮的部件属性 */
  propsAdvancedToggle?: Partial<ButtonProps>;
  /** 高级筛选那一行（条件构造器）的部件属性 */
  propsAdvanced?: Partial<ConditionBuilderProps>;
  /** 收起高级筛选后“清除”条件的按钮的部件属性 */
  propsClearAdvanced?: Partial<ButtonProps>;
  /** 常用的条件：Field */
  children?: VNodeChild;
}

/**
 * FilterBar 的配方（createUi / Provider 的 components.FilterBar 按它定制；QueryTable 的查询栏也是它）：root（form）、start、
 * body（start 右边那一列）、row（第一排）、fields（常用条件的栅格）、actions（按钮区）、toggle（展开收起）、advancedToggle、
 * reset、search、more（展开的条件的栅格）、advanced（条件构造器）、summary（收起后的高级筛选摘要）、clearAdvanced
 */
export const filterBarRecipe = css.recipe({
  name: 'FilterBar',
  parts: [
    'root',
    'start',
    'body',
    'row',
    'fields',
    'actions',
    'toggle',
    'advancedToggle',
    'reset',
    'search',
    'more',
    'advanced',
    'summary',
    'clearAdvanced',
    'count',
  ],
  base: {
    // start（标题）单独一列，其余都在它右边：展开的条件与第一排的条件左边对齐。窄到放不下时标题自己一行
    root: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      columnGap: '_xl',
      rowGap: '_md',
      minWidth: 0,
    },
    // 标题和按钮都与第一行的控件一样高、居中对齐
    start: { display: 'flex', alignItems: 'center', minHeight: t.sizes.control, flexShrink: 0 },
    // 第一排在上，展开的条件、高级筛选与它的摘要各占一行排在下面
    body: { display: 'flex', flexDirection: 'column', gap: '_md', flexGrow: 1, minWidth: 0 },
    // 第一排：条件、按钮区；窄到一个条件也放不下时按钮区换到下一行
    row: {
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      columnGap: '_xl',
      rowGap: '_md',
      minWidth: 0,
    },
    // 第一排与第二排起的条件都是栅格：每格不窄于 minFieldWidth，放得下几格就几格；第一排的分剩下的宽度、铺满
    fields: {
      display: 'grid',
      columnGap: '_xl',
      rowGap: '_md',
      alignItems: 'start',
      flexGrow: 1,
      minWidth: 0,
    },
    actions: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '_sm',
      minHeight: t.sizes.control,
      flexShrink: 0,
      marginInlineStart: 'auto',
    },
    more: { display: 'grid', columnGap: '_xl', rowGap: '_md', alignItems: 'start' },
    advanced: {
      padding: '_md',
      backgroundColor: '_surfaceMuted',
      borderWidth: '_xs',
      borderStyle: 'solid',
      borderColor: '_borderMuted',
      borderRadius: '_md',
    },
    summary: { display: 'flex', alignItems: 'baseline', gap: '_sm', minWidth: 0 },
  },
});

/** FilterBar 的部件（createUi / Provider 的 components.FilterBar.styles 按它定制） */
export type FilterBarPart = (typeof filterBarRecipe.parts)[number];

/**
 * FilterBar 的样式：columns（第二排起，空列留着、各排对齐）、columnsAs（第二排起，列宽取第一排每格的宽度）、
 * fill（第一排，空列收起、铺满）、basis（至少一格宽）
 */
const filterBarDynamicStyles = css.create({
  columns: (minWidth: string) => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(min(${minWidth}, 100%), 1fr))`,
  }),
  columnsAs: (width: number) => ({
    gridTemplateColumns: `repeat(auto-fill, minmax(min(${width}px, 100%), ${width}px))`,
  }),
  fill: (minWidth: string) => ({
    gridTemplateColumns: `repeat(auto-fit, minmax(min(${minWidth}, 100%), 1fr))`,
  }),
  basis: (minWidth: string) => ({ flexBasis: minWidth }),
});

/** 排版要的尺寸（px）：整排宽、条件之间的间距、每个条件的最小宽度、带“展开”按钮时按钮区的宽、其中“展开”按钮占的宽（含间距） */
interface FilterBarMetrics {
  row: number;
  gap: number;
  min: number;
  actions: number;
  toggle: number;
}

/**
 * 量出排版要的尺寸。“展开”按钮因为收起的条件直接显示而没渲染时量不到它，用上次量到的宽度（previousToggle），
 * 按钮区一律按带着它算：两种情况比的是同一个基准，不会来回切换
 */
function measure(
  row: HTMLElement,
  actions: HTMLElement,
  min: number,
  previousToggle: number,
): FilterBarMetrics {
  const element = actions.querySelector<HTMLElement>(':scope > [data-part="toggle"]');
  const actionsGap = parseFloat(getComputedStyle(actions).columnGap) || 0;
  const toggle = element ? element.offsetWidth + actionsGap : previousToggle;
  return {
    row: row.clientWidth,
    gap: parseFloat(getComputedStyle(row).columnGap) || 0,
    min,
    actions: actions.offsetWidth + (element ? 0 : toggle),
    toggle,
  };
}

/**
 * 条件怎么排：第一排放几个（null 是一个也放不下：条件在上、按钮区换到下面一行），收起的条件要不要直接显示。
 * 第一排放得下 n 个：条件区 = 整排 - 按钮区 - 间距，n 格占 n × min + (n - 1) × gap。
 * 收起的条件连同常用条件一起排、去掉“展开”按钮后，总排数不比收起时多，就直接显示（展开只有多出一排时才有意义）
 */
function layoutFields(m: FilterBarMetrics, common: number, extra: number) {
  const fit = (actions: number) => {
    const n = Math.floor((m.row - actions) / (m.min + m.gap));
    return n > 0 ? n : null;
  };
  // 一排排得下几格（每格宽 width）
  const columns = (width: number) => Math.max(1, Math.floor((m.row + m.gap) / (width + m.gap)));
  const rows = (count: number, first: number | null) => {
    if (first == null) return Math.ceil(count / columns(m.min));
    const inFirst = Math.min(count, first);
    const width = (m.row - m.actions - m.gap - (inFirst - 1) * m.gap) / inFirst;
    return 1 + Math.ceil((count - inFirst) / columns(width));
  };
  const withToggle = fit(m.actions);
  const bare = fit(m.actions - m.toggle);
  const inline = extra > 0 && rows(common + extra, bare) <= rows(common, withToggle);
  const first = inline ? bare : withToggle;
  // 第一排每格的宽度（auto-fit：空列折叠，有几个条件就几格分条件区）：第二排起的列宽跟它一样
  const count = inline ? common + extra : common;
  const cells = first == null ? Math.min(count, columns(m.min)) : Math.min(count, first);
  const area = first == null ? m.row : m.row - (inline ? m.actions - m.toggle : m.actions) - m.gap;
  const cell = cells > 0 ? (area - (cells - 1) * m.gap) / cells : null;
  return { inline, first, cell };
}

/** 查询栏：筛选条件的栅格，查询、重置，不常用的条件可以展开收起 */
export const FilterBar = _component(
  ({
    onSearch,
    onReset,
    loading = false,
    more,
    _expanded: expanded = _bindable(false),
    moreActive = 0,
    minFieldWidth,
    actions,
    start,
    end,
    labelPlacement,
    labelWidth,
    propsBody,
    propsRow,
    propsStart,
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
    propsClearAdvanced,
    children,
    ...rest
  }: FilterBarProps) => {
    const ui = useComponent(
      filterBarRecipe,
      () => ({ labelPlacement, labelWidth, minFieldWidth }),
      { labelPlacement: 'start', labelWidth: 'auto', minFieldWidth: '14em' },
    );
    const options = () => ui().options;
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
    provideFieldLayout(() => {
      const { labelPlacement, labelWidth } = options();
      return { labelPlacement, labelWidth };
    });

    // 第一排放得下几个条件、收起的要不要直接显示：按量出的尺寸算
    let rowElement = _state.raw<HTMLElement | null>(null);
    let actionsElement = _state.raw<HTMLElement | null>(null);
    let metrics = _state.raw<FilterBarMetrics | null>(null);
    useResizeObserver(
      () => [rowElement, actionsElement],
      // 改第一排的条件会改布局：放到下一帧，不在 ResizeObserver 的回调里同步改（会报 loop）
      () =>
        requestAnimationFrame(() => {
          const minWidth = rowElement && lengthToPx(options().minFieldWidth, rowElement);
          if (rowElement && actionsElement && minWidth)
            metrics = measure(rowElement, actionsElement, minWidth, metrics?.toggle ?? 0);
        }),
    );

    function onSubmit(event: Event) {
      event.preventDefault();
      onSearch?.();
    }

    return () => {
      const { options: o, parts: s } = ui();
      const common = childNodes(children);
      const extra = more != null ? childNodes(more) : [];
      // 量出来之前（服务端渲染、第一次渲染）常用条件都在第一排、收起的照旧收着
      const layout = metrics && layoutFields(metrics, common.length, extra.length);
      const inline = layout?.inline ?? false;
      const fields = inline ? [...common, ...extra] : common;
      const split =
        layout?.first != null && layout.first < fields.length ? layout.first : fields.length;
      const below = [...fields.slice(split), ...(!inline && expanded ? extra : [])];
      const toggleShown = more != null && !inline;
      return (
        <form
          {...mergeAttrs<'form'>(s.root, rest, {
            role: 'search',
            onSubmit,
          })}
          data-expanded={toggleShown ? expanded : undefined}
        >
          {start != null && <div {...mergeAttrs<'div'>(s.start, propsStart)}>{start}</div>}
          <div
            {...mergeAttrs<'div'>(
              { ...s.body, sx: [s.body.sx, filterBarDynamicStyles.basis(o.minFieldWidth)] },
              propsBody,
            )}
          >
            <div
              {...mergeAttrs<'div'>(s.row, propsRow, {
                ref: (element: unknown) => (rowElement = element as HTMLElement | null),
              })}
            >
              <div
                {...mergeAttrs<'div'>(
                  {
                    ...s.fields,
                    sx: [
                      s.fields.sx,
                      filterBarDynamicStyles.fill(o.minFieldWidth),
                      filterBarDynamicStyles.basis(o.minFieldWidth),
                    ],
                  },
                  propsFields,
                )}
              >
                {fields.slice(0, split)}
              </div>
              <div
                {...mergeAttrs<'div'>(s.actions, propsActions, {
                  ref: (element: unknown) => (actionsElement = element as HTMLElement | null),
                })}
              >
                {toggleShown && (
                  <Button
                    {...mergePartProps<ButtonProps>(
                      {
                        ...s.toggle,
                        variant: 'ghost',
                        tone: 'neutral',
                        iconEnd: ChevronDown,
                        propsIconEnd: {
                          sx: [disclosureStyles.icon, expanded && disclosureStyles.flip],
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
                      <Badge {...s.count} tone="accent" radius="full">
                        {messages.filterActive(moreActive)}
                      </Badge>
                    )}
                  </Button>
                )}
                {conditionFields && (
                  <Button
                    {...mergePartProps<ButtonProps>(
                      { ...s.advancedToggle, variant: 'ghost', tone: 'neutral', icon: ListFilter },
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
                      <Badge {...s.count} tone="accent" radius="full">
                        {messages.filterActive(countRules(condition))}
                      </Badge>
                    )}
                  </Button>
                )}
                {actions}
                <Button
                  {...mergePartProps<ButtonProps>(
                    { ...s.reset, variant: 'outline', tone: 'neutral' },
                    propsReset,
                    {
                      type: 'button',
                      onClick: () => {
                        if (conditionFields) condition = null;
                        onReset?.();
                      },
                    },
                  )}
                >
                  {messages.filterReset}
                </Button>
                <Button
                  {...mergePartProps<ButtonProps>({ ...s.search, loading }, propsSearch, {
                    type: 'submit',
                  })}
                >
                  {messages.filterSearch}
                </Button>
                {end}
              </div>
            </div>
            {below.length > 0 && (
              <div
                {...mergeAttrs<'div'>(
                  {
                    ...s.more,
                    sx: [
                      s.more.sx,
                      // 第一排量出来之后列宽跟它的每格一样，上下对齐；量出来之前按最小宽度排
                      layout?.cell
                        ? filterBarDynamicStyles.columnsAs(layout.cell)
                        : filterBarDynamicStyles.columns(o.minFieldWidth),
                    ],
                  },
                  propsMore,
                  { id: moreId },
                )}
              >
                {below}
              </div>
            )}
            {conditionFields && advancedOpen && (
              <ConditionBuilder
                {...mergePartProps<ConditionBuilderProps>(
                  { ...s.advanced, fields: conditionFields, 'aria-label': messages.filterAdvanced },
                  propsAdvanced,
                  { id: advancedId },
                )}
                _value={condition}
              />
            )}
            {conditionFields && !advancedOpen && condition && (
              <div {...mergeAttrs<'div'>(s.summary)}>
                <Small tone="muted">
                  {messages.filterAdvanced}：{describeCondition(condition, conditionFields, lang)}
                </Small>
                <Button
                  {...mergePartProps<ButtonProps>(
                    { ...s.clearAdvanced, variant: 'link', size: 'sm' },
                    propsClearAdvanced,
                    {
                      type: 'button',
                      onClick: () => (condition = null),
                    },
                  )}
                >
                  {lang.clear}
                </Button>
              </div>
            )}
          </div>
        </form>
      );
    };
  },
);
