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
 * 语义是有序列表；时间用 <time>（给了 dateTime 时写上机器可读的时间）。
 * 部件：Root（ol）、Item（li）、Rail（节点与连接线所在的列）、Marker、Line（连接线）、Content、Title、Time、Description。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { StyleXStyles } from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import { Spinner } from '../base/Spinner';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
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
  /** 说明 */
  description?: VNodeChild;
  /** 节点的图标；不写时是圆点 */
  icon?: IconData;
  /** 节点的色调，默认 neutral */
  tone?: StatusTone;
}

/** 未声明的属性落到 ol 上 */
export interface TimelineProps extends PartProps<'ol'> {
  /** 各项，旧的在前 */
  items: readonly TimelineItem[];
  /** 还在进行中：最后多一项，节点是加载指示，内容是它 */
  pending?: VNodeChild;
  /** 左右交替排布（时间在对侧）；窄的容器里仍是单侧 */
  alternate?: boolean;
  /** 字号档位；不写时继承 */
  size?: TextSize;
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
  /** 时间的部件属性 */
  propsTime?: PartProps<'time', 'datetime'>;
  /** 说明的部件属性 */
  propsDescription?: PartProps<'div'>;
}

/** Timeline 的样式：root、item、marker、line、content、title、time、description 等 */
export const timelineStyles = stylex.create({
  // 竖排、去掉编号由 FlexOrderedList 给；交替排布按容器宽度切换
  root: { containerType: 'inline-size' },
  // 节点一列、内容一列；交替时三列：左内容、节点、右内容
  item: { display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '_md' },
  itemAlternate: {
    gridTemplateColumns: { default: '1fr auto 1fr', '@container (max-width: 32em)': 'auto 1fr' },
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
  time: { fontSize: '_sm', color: '_textMuted' },
  // 交替排布时时间放在对侧（它自己占一格）；窄的容器里不占格，改在内容里显示
  timeOpposite: {
    paddingBlockStart: '0.125em',
    display: { default: 'block', '@container (max-width: 32em)': 'none' },
  },
  timeInline: { display: { default: 'none', '@container (max-width: 32em)': 'block' } },
  description: { color: '_text' },
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
    propsItem,
    propsRail,
    propsMarker,
    propsLine,
    propsContent,
    propsTitle,
    propsTime,
    propsDescription,
    ...rest
  }: TimelineProps) =>
    () => {
      const all: (TimelineItem & { pending?: true })[] = [
        ...items,
        ...(pending != null ? [{ key: 'pending', title: pending, pending: true as const }] : []),
      ];
      return (
        <FlexOrderedList
          {...mergePartProps<FlexProps<'ol'>>(
            { direction: 'column', sx: [timelineStyles.root, size && fontSizeStyles[size]] },
            rest,
          )}
          data-alternate={alternate || undefined}
        >
          {all.map((item, index) => {
            const own = typeof propsItem === 'function' ? propsItem(item, index) : propsItem;
            const last = index === all.length - 1;
            const end = alternate && index % 2 === 1;
            // 交替排布时时间放在对侧，占一格（没有时间也占，保持三列对齐）；窄的容器里改在内容里显示
            const time = (sx: StyleXStyles) =>
              item.time != null ? (
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
                  {alternate ? item.time != null && time(timelineStyles.timeInline) : time(null)}
                  {item.description != null && (
                    <div
                      {...mergeAttrs<'div'>({ sx: timelineStyles.description }, propsDescription)}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
                {end && time(timelineStyles.timeOpposite)}
              </li>
            );
          })}
        </FlexOrderedList>
      );
    },
);
