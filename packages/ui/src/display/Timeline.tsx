/**
 * 时间线（ol）：按时间排列的事件（订单进度、操作记录、版本历史）。每项一个节点（圆点或图标，带色调）+ 标题、时间、说明，
 * 节点之间连一条线；可以左右交替排布；还在进行中时最后一项显示加载指示（pending）。参考 Ant Design Timeline。
 *
 *   <Timeline
 *     items={[
 *       { title: '已下单', time: '10-18 09:12' },
 *       { title: '已发货', time: '10-18 15:40', tone: 'success', icon: Truck },
 *     ]}
 *     pending="正在派送"
 *   />
 *
 * items 按时间先后给；reverse 时新的在前（操作记录、流转记录常这样看），进行中的一项也在最前。
 * 流程的流转记录用 `@vue-tsx-pro/ui/workflow` 的 useWorkflowTimeline 写成 items。
 *
 * 操作记录：项写 actor（操作人，可以带 avatar 头像）显示在时间前面；description 里可以放 FieldCompare 列出改了哪些字段；
 * 长的内容（完整的字段对比、附件、原文）放 details，项里一个“查看详情”的按钮点开才显示。
 * 记录多时写 maxVisible：只显示最新的几项，其余收起在“展开其余 N 条”后面（按钮在旧的那一端，展开后变成“收起”）。
 *
 * 语义是有序列表；时间用 <time>（给了 dateTime 时写上机器可读的时间）。
 * 部件：Root（ol）、Item（li）、Rail（节点与连接线所在的列）、Marker、Line（连接线）、Content、Title、Meta（操作人与时间）、
 * Time、Description、Details（Collapsible）、Toggle（展开其余各项的按钮）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import { ChevronDown, ChevronUp } from '@lucide/icons';
import type { VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { Icon, type IconData } from '../base/Icon';
import { Spinner } from '../base/Spinner';
import { useLang } from '../config/context';
import { Avatar, initials } from './Avatar';
import { Collapsible, type CollapsibleProps } from './Collapsible';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { fontSizeStyles, type TextSize } from '../utils/style/typography';
import type { StatusTone } from '../utils/style/tone-styles';
import { FlexOrderedList, type FlexProps } from '../layout/Flex';

/** 时间线上的一项 */
export interface TimelineItem {
  /** 唯一的 key；不写时用位置 */
  key?: string;
  /** 标题 */
  title: VNodeChild;
  /** 时间（显示的文字） */
  time?: VNodeChild;
  /** 机器可读的时间（ISO 8601），写到 <time datetime> 上 */
  dateTime?: string;
  /** 说明：一段文字，或字段差异（FieldCompare layout="list"）这类内容 */
  description?: VNodeChild;
  /** 操作人：显示在时间前面 */
  actor?: VNodeChild;
  /** 操作人的头像地址；actor 是文字时没有图片也显示首字母 */
  avatar?: string;
  /** 收起的详情：项里一个“查看详情”的按钮，点开才显示 */
  details?: VNodeChild;
  /** 节点的图标；不写时是圆点 */
  icon?: IconData;
  /** 节点的色调，默认 neutral */
  tone?: StatusTone;
}

/** 未声明的属性落到 ol 上 */
export interface TimelineProps extends PartProps<'ol'> {
  /** 各项，按时间先后（旧的在前） */
  items: readonly TimelineItem[];
  /** 还在进行中：最后多一项，节点是加载指示，内容是它 */
  pending?: VNodeChild;
  /** 新的在前：倒过来显示（进行中的一项也在最前），ol 带 reversed */
  reverse?: boolean;
  /** 左右交替排布（时间在对侧）；窄的容器里仍是单侧 */
  alternate?: boolean;
  /** 字号档位；不写时继承 */
  size?: TextSize;
  /** 最多显示几项（不算进行中的一项）：只显示最新的这几项，其余收起在“展开其余 N 条”后面 */
  maxVisible?: number;
  /** 收起的各项展开了没有（可绑定） */
  expanded?: boolean;
  /** 每一项（li）的部件属性，可以按项计算 */
  propsItem?: PartProps<'li'> | ((item: TimelineItem, index: number) => PartProps<'li'>);
  /** 节点与连接线所在的列的部件属性 */
  propsRail?: PartProps<'div'>;
  /** 节点的部件属性 */
  propsMarker?: PartProps<'span'>;
  /** 连接线的部件属性 */
  propsLine?: PartProps<'span'>;
  /** 内容（标题、时间、说明）的部件属性 */
  propsContent?: PartProps<'div'>;
  /** 标题的部件属性 */
  propsTitle?: PartProps<'div'>;
  /** 操作人与时间那一行的部件属性 */
  propsMeta?: PartProps<'div'>;
  /** 时间的部件属性 */
  propsTime?: PartProps<'time', 'datetime'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'div'>;
  /** 详情（Collapsible）的部件属性 */
  propsDetails?: Partial<CollapsibleProps>;
  /** 展开其余各项的按钮的部件属性 */
  propsToggle?: Partial<ButtonProps>;
}

/** Timeline 的样式：root、item、marker、line、content、title、time、description 等 */
export const timelineStyles = stylex.create({
  // 竖排、去掉编号由 FlexOrderedList 给；交替排布按容器宽度切换
  root: { containerType: 'inline-size' },
  // 节点一列、内容一列；交替时三列：左内容、节点、右内容。
  // 每项是独立的 grid，节点列至少有图标节点那么宽，圆点、图标、加载指示混排时各项才对得齐
  item: { display: 'grid', gridTemplateColumns: 'minmax(1.5em, auto) 1fr', columnGap: '_md' },
  itemAlternate: {
    gridTemplateColumns: {
      default: '1fr minmax(1.5em, auto) 1fr',
      '@container (max-width: 32em)': 'minmax(1.5em, auto) 1fr',
    },
  },
  rail: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  marker: {
    boxSizing: 'border-box',
    flexShrink: 0,
    width: '0.75em',
    height: '0.75em',
    marginBlock: '0.375em',
    borderRadius: '_full',
    backgroundColor: 'currentColor',
  },
  // 有图标时节点大一些，图标描边用色调
  markerIcon: {
    display: 'grid',
    placeItems: 'center',
    width: '1.5em',
    height: '1.5em',
    marginBlock: 0,
    backgroundColor: '_surface',
    borderWidth: '_sm',
    borderStyle: 'solid',
    borderColor: 'currentColor',
  },
  pending: { marginBlock: '0.25em' },
  // 连到下一项的线；最后一项没有
  line: {
    flexGrow: 1,
    width: '_borderWidths.sm',
    minHeight: '1em',
    backgroundColor: '_borderMuted',
  },
  content: { minWidth: 0, paddingBlockEnd: '_lg', display: 'grid', gap: '_xs' },
  // 交替排布时偶数项的内容在节点左侧、靠右对齐
  contentEnd: {
    gridColumn: { default: '1', '@container (max-width: 32em)': '2' },
    gridRow: '1',
    textAlign: { default: 'end', '@container (max-width: 32em)': 'start' },
  },
  title: { fontWeight: '_semibold', color: '_text' },
  // 操作人与时间：一行，放不下时换行
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '_sm',
    rowGap: '_xs',
    fontSize: '_sm',
    color: '_textMuted',
  },
  actor: { display: 'inline-flex', alignItems: 'center', gap: '_xs', color: '_text' },
  avatar: { width: '1.75em', height: '1.75em' },
  time: { fontSize: '_sm', color: '_textMuted' },
  // 交替排布时时间放在对侧（它自己占一格）；窄的容器里不占格，改在内容里显示
  timeOpposite: {
    paddingBlockStart: '0.125em',
    display: { default: 'block', '@container (max-width: 32em)': 'none' },
  },
  timeInline: { display: { default: 'none', '@container (max-width: 32em)': 'block' } },
  description: { color: '_text' },
  // 详情按钮像链接，靠起始边；展开的内容与上面隔开一点
  detailsToggle: { justifySelf: 'start' },
  detailsContent: { paddingBlockStart: '_xs' },
  // 收起的那几项的位置：节点列是一段虚线，内容是按钮
  toggleLine: {
    flexGrow: 1,
    minHeight: '2em',
    borderInlineStartWidth: '_sm',
    borderInlineStartStyle: 'dashed',
    borderInlineStartColor: '_borderMuted',
  },
  toggleContent: { paddingBlockEnd: '_lg' },
});

/** Timeline 的样式：节点的色调 */
export const timelineToneStyles = stylex.create({
  neutral: { color: '_borderStrong' },
  accent: { color: '_accent' },
  info: { color: '_infoText' },
  success: { color: '_successText' },
  warning: { color: '_warningText' },
  danger: { color: '_dangerText' },
});

/** 时间线：节点 + 内容，节点之间连线 */
export const Timeline = _component(
  ({
    items,
    pending,
    alternate = false,
    size,
    reverse = false,
    maxVisible,
    expanded = _bindable(false),
    propsItem,
    propsRail,
    propsMarker,
    propsLine,
    propsContent,
    propsTitle,
    propsMeta,
    propsTime,
    propsDescription,
    propsDetails,
    propsToggle,
    ...rest
  }: TimelineProps) => {
    const lang = useLang();

    /** 收起的那几项所在的位置：节点列一段虚线，内容是展开、收起的按钮 */
    const toggle = (hidden: number) => (
      <li key="toggle" {...stylex.attrs(timelineStyles.item)}>
        <div {...mergeAttrs<'div'>({ sx: timelineStyles.rail }, propsRail)}>
          <span {...stylex.attrs(timelineStyles.toggleLine)} aria-hidden="true" />
        </div>
        <div {...stylex.attrs(timelineStyles.toggleContent)}>
          <Button
            {...mergePartProps<ButtonProps>(
              {
                variant: 'link',
                size: 'sm',
                iconEnd: expanded ? ChevronUp : ChevronDown,
              },
              propsToggle,
              { 'aria-expanded': expanded, onClick: () => (expanded = !expanded) },
            )}
          >
            {expanded ? lang.timelineShowLess : lang.timelineShowMore(hidden)}
          </Button>
        </div>
      </li>
    );

    return () => {
      const hidden =
        maxVisible !== undefined && items.length > maxVisible ? items.length - maxVisible : 0;
      const chronological: (TimelineItem & { pending?: true })[] = [
        ...(hidden > 0 && !expanded ? items.slice(hidden) : items),
        ...(hasContent(pending)
          ? [{ key: 'pending', title: pending, pending: true as const }]
          : []),
      ];
      const all = reverse ? chronological.toReversed() : chronological;
      // 按钮在旧的那一端：倒序时在最后，最后一项仍连线到它
      const toggleAtEnd = hidden > 0 && reverse;
      return (
        <FlexOrderedList
          {...mergePartProps<FlexProps<'ol'>>(
            { direction: 'column', sx: [timelineStyles.root, size && fontSizeStyles[size]] },
            rest,
          )}
          data-alternate={alternate || undefined}
          reversed={reverse || undefined}
        >
          {hidden > 0 && !reverse && toggle(hidden)}
          {all.map((item, index) => {
            const own = typeof propsItem === 'function' ? propsItem(item, index) : propsItem;
            const last = index === all.length - 1 && !toggleAtEnd;
            const end = alternate && index % 2 === 1;
            // 交替排布时时间放在对侧，占一格（没有时间也占，保持三列对齐）；窄的容器里改在内容里显示
            const time = (sx: StyleXStyles) =>
              hasContent(item.time) ? (
                <time
                  {...mergeAttrs<'time'>({ sx: [timelineStyles.time, sx] }, propsTime, {
                    datetime: item.dateTime,
                  })}
                >
                  {item.time}
                </time>
              ) : (
                alternate && <span {...stylex.attrs(sx)} />
              );
            // 内容里的时间：交替排布时只在窄的容器里显示（宽时在对侧）
            const inlineTime = alternate
              ? hasContent(item.time) && time(timelineStyles.timeInline)
              : time(null);
            const marker = item.pending ? (
              <Spinner sx={[timelineStyles.pending, timelineToneStyles.accent]} />
            ) : (
              <span
                {...mergeAttrs<'span'>(
                  {
                    sx: [
                      timelineStyles.marker,
                      item.icon && timelineStyles.markerIcon,
                      timelineToneStyles[item.tone ?? 'neutral'],
                    ],
                  },
                  propsMarker,
                  { 'aria-hidden': true },
                )}
              >
                {item.icon && <Icon icon={item.icon} />}
              </span>
            );
            return (
              <li
                key={item.key ?? index}
                {...mergeAttrs<'li'>(
                  { sx: [timelineStyles.item, alternate && timelineStyles.itemAlternate] },
                  own,
                )}
                data-state={item.pending ? 'pending' : undefined}
                aria-busy={item.pending || undefined}
              >
                {/* 交替排布：奇数项左侧放时间，偶数项右侧放时间 */}
                {alternate && !end && time(timelineStyles.timeOpposite)}
                <div {...mergeAttrs<'div'>({ sx: timelineStyles.rail }, propsRail)}>
                  {marker}
                  {!last && (
                    <span
                      {...mergeAttrs<'span'>({ sx: timelineStyles.line }, propsLine, {
                        'aria-hidden': true,
                      })}
                    />
                  )}
                </div>
                <div
                  {...mergeAttrs<'div'>(
                    { sx: [timelineStyles.content, end && timelineStyles.contentEnd] },
                    propsContent,
                  )}
                >
                  <div {...mergeAttrs<'div'>({ sx: timelineStyles.title }, propsTitle)}>
                    {item.title}
                  </div>
                  {hasContent(item.actor) ? (
                    <div {...mergeAttrs<'div'>({ sx: timelineStyles.meta }, propsMeta)}>
                      <span {...stylex.attrs(timelineStyles.actor)}>
                        {(item.avatar || typeof item.actor === 'string') && (
                          <Avatar
                            src={item.avatar}
                            fallback={
                              typeof item.actor === 'string' ? initials(item.actor) : undefined
                            }
                            sx={timelineStyles.avatar}
                          />
                        )}
                        {item.actor}
                      </span>
                      {inlineTime}
                    </div>
                  ) : (
                    inlineTime
                  )}
                  {hasContent(item.description) && (
                    <div
                      {...mergeAttrs<'div'>({ sx: timelineStyles.description }, propsDescription)}
                    >
                      {item.description}
                    </div>
                  )}
                  {hasContent(item.details) && (
                    <Collapsible
                      {...mergePartProps<Partial<CollapsibleProps>>(
                        { lazy: true, propsContent: { sx: timelineStyles.detailsContent } },
                        propsDetails,
                      )}
                      trigger={(props) => (
                        <Button
                          variant="link"
                          size="sm"
                          iconEnd={props['aria-expanded'] ? ChevronUp : ChevronDown}
                          sx={timelineStyles.detailsToggle}
                          {...props}
                        >
                          {lang.timelineDetails}
                        </Button>
                      )}
                    >
                      {item.details}
                    </Collapsible>
                  )}
                </div>
                {end && time(timelineStyles.timeOpposite)}
              </li>
            );
          })}
          {toggleAtEnd && toggle(hidden)}
        </FlexOrderedList>
      );
    };
  },
);
