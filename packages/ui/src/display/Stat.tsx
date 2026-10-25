/**
 * 统计数值（dl）：指标名、数值与单位、可选的图标与环比变化。仪表盘顶部的一排卡片、详情页的关键指标。
 * 外观只是内容，放进 Card、Grid 里组合：
 *
 *   <Card><Stat label="实际销售额" value={910.36} unit="万元" icon={Wallet} change={0.123} changeLabel="较上月" /></Card>
 *   <Stat label="测算销售" value={a} format={wan} unit="万元" footer={<><span>年度目标 2,000 万元</span><span>完成 81%</span></>}>
 *     <Progress value={81} size="xs" aria-label="年度目标完成度" />
 *   </Stat>
 *
 * 排版（参考 Ant Design Pro 的 ChartCard）：第一行是图标与指标名、结束边是变化量；第二行是数值；
 * children 是数值下面占满整宽的补充内容（进度条、迷你图）；footer 是底栏，上方一条分隔线，放两项时分别靠两端。
 * 卡片再宽，内容也铺满整行，不在中间留一大块空白。
 *
 * 一排几个指标用 StatGroup：按宽度换行，指标之间一条竖线（同一行里）：
 *
 *   <StatGroup><Stat label="超时" value={10} tone="danger" /><Stat label="待验收" value={5} /></StatGroup>
 *
 * 数值变化时滚动过渡（AnimatedNumber），读屏只读终值；变化量按正负着色并带箭头，
 * 成本、耗时这类“越低越好”的指标写 invertChange。加载中（loading）数值与变化量换成扫光的骨架，指标名照常显示。
 */
import { TrendingDown, TrendingUp } from '@lucide/icons';
import { createContext, _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { Icon, type IconData } from '../base/Icon';
import type { NumericFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import { useDelayedLoading } from '../utils/motion/delayed-loading';
import { hasContent, mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { shimmerStyles } from '../utils/style/shimmer';
import { toneStyles, type Tone } from '../utils/style/typography';
import type { NumericValue } from '../utils/data/numeric';
import { AnimatedNumber, type AnimatedNumberProps } from './AnimatedNumber';
import { t } from '../config/theme/tokens';

/** 忙碌由组件按 loading 管理 */
export type StatManaged = 'aria-busy';

/** 未声明的属性落到外层 dl 上 */
export interface StatProps extends PartProps<'dl', StatManaged> {
  /** 指标名 */
  label: VNodeChild;
  /** 数值：number、bigint、Decimal 按当前语言格式化并在变化时滚动；字符串原样显示（如“—”、“98.5%”） */
  value: NumericValue | string;
  /**
   * 数值的格式，如两位小数 `{ minimumFractionDigits: 2 }`、百分比 `{ style: 'percent' }`；
   * 值以元给出、按万元显示时写 `{ scale: 10_000, maximumFractionDigits: 2 }` 并配 `unit="万元"`
   */
  format?: NumericFormat;
  /** 单位，跟在数值后面、字号小一档 */
  unit?: VNodeChild;
  /** 数值的色调：超时、缺漏这类要引起注意的数用 danger、warning；不写时是正文色 */
  tone?: Tone;
  /** 指标名前面的图标（装饰，对读屏隐藏） */
  icon?: IconData;
  /** 变化量（环比、同比）：正数向上、负数向下；默认按百分比显示（0.12 → +12%） */
  change?: number;
  /** 变化量的格式，默认 `{ style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }` */
  changeFormat?: NumericFormat;
  /** 变化量后面的说明，如“较上月” */
  changeLabel?: VNodeChild;
  /** 下降是好事（成本、耗时、故障数）：下降显示成功色、上升显示危险色 */
  invertChange?: boolean;
  /** 数值下面的补充说明（一行小字） */
  description?: VNodeChild;
  /** 底栏：上方一条分隔线；放两项时分别靠两端，如“年度目标 2,000 万元”与“完成 81%” */
  footer?: VNodeChild;
  /** 数值下面占满整宽的补充内容：进度条、迷你图 */
  children?: VNodeChild;
  /**
   * 加载中：数值与变化量换成扫光的骨架，带 aria-busy；很快完成时不闪
   * @default false
   */
  loading?: boolean;
  /** 指标名（dt）的部件属性 */
  propsLabel?: PartProps<'dt'>;
  /** 数值（dd）的部件属性 */
  propsValue?: PartProps<'dd'>;
  /** 图标外层的部件属性 */
  propsIcon?: PartProps<'span', 'aria-hidden'>;
  /** 数字本身（AnimatedNumber 或字符串值的 span）的部件属性 */
  propsNumber?: PartProps<'span', 'prefix'>;
  /** 单位的部件属性 */
  propsUnit?: PartProps<'span'>;
  /** 变化（dd）的部件属性 */
  propsChange?: PartProps<'dd'>;
  /** 变化后面的说明的部件属性 */
  propsChangeLabel?: PartProps<'span'>;
  /** 补充说明（dd）的部件属性 */
  propsDescription?: PartProps<'dd'>;
  /** 补充内容（dd，children 的外层）的部件属性 */
  propsBody?: PartProps<'dd'>;
  /** 底栏（dd）的部件属性 */
  propsFooter?: PartProps<'dd'>;
}

const CHANGE_FORMAT: NumericFormat = {
  style: 'percent',
  maximumFractionDigits: 1,
  signDisplay: 'exceptZero',
};

/** 在 StatGroup 里：指标之间画竖线 */
const StatGroupContext = createContext<boolean>('StatGroup');

/** Stat 的样式：root、label、icon、value、number、unit、change、description、body、footer、skeleton… */
export const statStyles = css.create({
  // 第一行是指标名与变化量（结束边），其余各占一整行。可换行的弹性布局而不是两列网格：
  // 卡片窄时变化量换到下一行，指标名不被挤成一字一行；DOM 顺序不变（读屏仍是名称、数值、变化量）
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: '_sm',
    rowGap: '_xs',
    margin: 0,
    minWidth: 0,
  },
  // dt 里放图标与指标名：dl 的子元素只能是 dt、dd
  label: {
    order: 0,
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    minWidth: 0,
    margin: 0,
    color: '_textMuted',
    fontSize: '_sm',
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '1.75em',
    height: '1.75em',
    borderRadius: '_md',
    backgroundColor: '_accentSoft',
    color: '_accentText',
  },
  value: {
    order: 2,
    flexBasis: '100%',
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '_xs',
    margin: 0,
  },
  number: {
    fontSize: '_xxl',
    fontWeight: '_bold',
    lineHeight: '_tight',
    color: '_text',
    fontVariantNumeric: 'tabular-nums',
  },
  unit: { color: '_textMuted', fontSize: '_xs' },
  // 变化量在指标名那一行的结束边
  change: {
    order: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '_xs',
    fontSize: '_xs',
    margin: 0,
    whiteSpace: 'nowrap',
  },
  changeLabel: { color: '_textMuted' },
  description: { order: 3, flexBasis: '100%', color: '_textMuted', fontSize: '_xs', margin: 0 },
  body: { order: 3, flexBasis: '100%', margin: 0, minWidth: 0 },
  // 底栏：两项时分别靠两端，多了换行
  footer: {
    order: 3,
    flexBasis: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: '_md',
    rowGap: '_xs',
    margin: 0,
    marginBlockStart: '_xs',
    paddingBlockStart: '_sm',
    borderBlockStartWidth: '_xs',
    borderBlockStartStyle: 'solid',
    borderBlockStartColor: '_borderMuted',
    color: '_textMuted',
    fontSize: '_xs',
  },
  // 骨架与数值、变化量同高：加载完换成内容时不跳
  numberSkeleton: { fontSize: '_xxl', width: '4em', height: '1.25em' },
  changeSkeleton: { width: '6em', height: '1.5em' },
});

/** 统计数值：指标名、数值与单位、图标、变化量 */
export const Stat = _component(
  ({
    label,
    value,
    format,
    unit,
    tone,
    icon,
    change,
    changeFormat = CHANGE_FORMAT,
    changeLabel,
    invertChange = false,
    description,
    footer,
    children,
    loading = false,
    propsLabel,
    propsValue,
    propsIcon,
    propsNumber,
    propsUnit,
    propsChange,
    propsChangeLabel,
    propsDescription,
    propsBody,
    propsFooter,
    ...rest
  }: StatProps) => {
    const grouped = StatGroupContext.inject(false);
    // 骨架防闪烁；aria-busy 按真实的 loading
    const skeleton = useDelayedLoading(() => loading);
    // 出现过骨架之后，换回数值时淡入（样式在切换的那一刻加上，动画才会播）
    let revealing = false;
    return () => {
      if (skeleton.value) revealing = true;
      const reveal = revealing && !skeleton.value && shimmerStyles.reveal;
      const direction = change === undefined || change === 0 ? 'flat' : change > 0 ? 'up' : 'down';
      const improved = invertChange ? direction === 'down' : direction === 'up';
      const changeTone = direction === 'flat' ? 'muted' : improved ? 'success' : 'danger';
      return (
        <dl
          {...mergeAttrs<'dl'>({ sx: [statStyles.root, grouped && statGroupStyles.item] }, rest, {
            'aria-busy': loading || undefined,
          })}
        >
          <dt {...mergeAttrs<'dt'>({ sx: statStyles.label }, propsLabel)}>
            {icon && (
              <span
                {...mergeAttrs<'span'>({ sx: statStyles.icon }, propsIcon, { 'aria-hidden': true })}
              >
                <Icon icon={icon} />
              </span>
            )}
            <span>{label}</span>
          </dt>
          <dd {...mergeAttrs<'dd'>({ sx: [statStyles.value, reveal] }, propsValue)}>
            {skeleton.value ? (
              <Skeleton sx={statStyles.numberSkeleton} />
            ) : typeof value !== 'string' ? (
              <AnimatedNumber
                {...mergePartProps<AnimatedNumberProps>(
                  { sx: [statStyles.number, tone && toneStyles[tone]], value },
                  propsNumber,
                  {
                    value,
                    format,
                  },
                )}
              />
            ) : (
              <span
                {...mergeAttrs<'span'>(
                  { sx: [statStyles.number, tone && toneStyles[tone]] },
                  propsNumber,
                )}
              >
                {value}
              </span>
            )}
            {unit != null && !skeleton.value && (
              <span {...mergeAttrs<'span'>({ sx: statStyles.unit }, propsUnit)}>{unit}</span>
            )}
          </dd>
          {change !== undefined && (
            <dd
              {...mergeAttrs<'dd'>({ sx: [statStyles.change, reveal] }, propsChange)}
              data-trend={skeleton.value ? undefined : direction}
            >
              {skeleton.value ? (
                <Skeleton sx={statStyles.changeSkeleton} />
              ) : (
                <>
                  <span {...css.attrs(toneStyles[changeTone])}>
                    {direction !== 'flat' && (
                      <Icon
                        icon={direction === 'up' ? TrendingUp : TrendingDown}
                        aria-hidden="true"
                      />
                    )}{' '}
                    <AnimatedNumber value={change} format={changeFormat} />
                  </span>
                  {changeLabel != null && (
                    <span {...mergeAttrs<'span'>({ sx: statStyles.changeLabel }, propsChangeLabel)}>
                      {changeLabel}
                    </span>
                  )}
                </>
              )}
            </dd>
          )}
          {hasContent(description) && (
            <dd {...mergeAttrs<'dd'>({ sx: statStyles.description }, propsDescription)}>
              {description}
            </dd>
          )}
          {hasContent(children) && (
            <dd {...mergeAttrs<'dd'>({ sx: statStyles.body }, propsBody)}>{children}</dd>
          )}
          {hasContent(footer) && (
            <dd {...mergeAttrs<'dd'>({ sx: statStyles.footer }, propsFooter)}>{footer}</dd>
          )}
        </dl>
      );
    };
  },
);

/** 未声明的属性落到外层 div 上 */
export interface StatGroupProps extends PartProps<'div'> {
  /**
   * 每个指标最窄多宽（CSS 长度）：放不下就换行
   * @default '9rem'
   */
  minItemWidth?: string;
  /** Stat */
  children?: VNodeChild;
}

/** StatGroup 的样式：root、item */
export const statGroupStyles = css.create({
  // 每个指标的起始边一条竖线；整组往起始方向挪一条线的位置，每行第一个的竖线藏到外面（overflow 裁掉）
  root: { display: 'grid', rowGap: '_md', overflow: 'hidden' },
  item: {
    paddingInline: '_md',
    marginInlineStart: `calc(-1 * ${t.borderWidths.xs})`,
    borderInlineStartWidth: '_xs',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_borderMuted',
  },
});

/** StatGroup 的动态样式：列宽 */
export const statGroupDynamicStyles = css.create({
  columns: (min: string) => ({
    gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}, 100%), 1fr))`,
  }),
});

/** 一排指标：按宽度换行，同一行里指标之间一条竖线 */
export const StatGroup = _component(
  ({ minItemWidth = '9rem', children, ...rest }: StatGroupProps) => {
    StatGroupContext.provide(true);
    return () => (
      <div
        {...mergeAttrs<'div'>(
          { sx: [statGroupStyles.root, statGroupDynamicStyles.columns(minItemWidth)] },
          rest,
        )}
      >
        {children}
      </div>
    );
  },
);
