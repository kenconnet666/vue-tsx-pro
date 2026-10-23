/**
 * 漏斗图：一串前后相接的环节，看每一步留下多少、在哪一步流失最多（建议 → 立项 → 任务 → 兑现、注册转化）。
 *
 *   <FunnelChart aria-label="渠道转化" stages={[{ label: '提交建议', value: 120 }, { label: '立项', value: 46 }]} unit="项" />
 *
 * 每个环节一条居中的横条，长短按数值（最大的环节占满）；环节之间写比上一环节的转化率，末尾写总转化。
 * 横条默认同一个颜色（chart1），环节可以单独给 color。Unovis 没有漏斗图：这里用主题 tokens 直接画，
 * 外层结构（单位、加载与空状态、给读屏的数据表）同其他图表（见 ChartFrame）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import type { VNodeChild } from 'vue';
import { useLang } from '../config/context';
import { useFormat, type NumericFormat } from '../config/lang/format';
import { Skeleton } from '../feedback/Skeleton';
import { toNumber, type NumericValue } from '../utils/data/numeric';
import type { PartProps } from '../utils/props';
import { ChartFrame, type ChartFrameParts } from './frame';
import { resolveColor, type ChartColor } from './series';
import { t } from '../config/theme/tokens';

/** 漏斗的一个环节 */
export interface FunnelStage {
  /** 名称 */
  label: string;
  /** 数值：number、bigint 或 Decimal */
  value: NumericValue;
  /** 颜色；不写时用图表的 color */
  color?: ChartColor;
}

/** 未声明的属性落到外层 div（role="figure"）上，aria-label 是图表的名称 */
export interface FunnelChartProps extends PartProps<'div', 'role' | 'aria-busy'>, ChartFrameParts {
  /** 各环节：从上到下 */
  stages: readonly FunnelStage[];
  /** 数值的格式（可缩放）：横条旁的数值与数据表共用 */
  valueFormat?: NumericFormat;
  /** 单位：显示在左上方，数值后面带上 */
  unit?: string;
  /**
   * 横条的颜色
   * @default 'chart1'
   */
  color?: ChartColor;
  /**
   * 环节之间写转化率，末尾写总转化
   * @default true
   */
  rates?: boolean;
  /**
   * 加载中：显示几条骨架，带 aria-busy
   * @default false
   */
  loading?: boolean;
  /** 没有数据时显示的内容，默认是“暂无数据” */
  empty?: VNodeChild;
  /**
   * 点了一个环节（下钻）：参数是这个环节与它的位置；写了它时指针是手形。
   * 点图是鼠标的捷径：同样的去处在页面上还要有链接或按钮
   */
  onItemClick?: (stage: FunnelStage, index: number) => void;
}

/** FunnelChart 的样式：list、row、label、track、bar、value、rate… */
export const funnelChartStyles = stylex.create({
  // 名称 | 居中的横条 | 数值：三列由整个列表定宽，各行用 subgrid 对齐
  list: {
    display: 'grid',
    gridTemplateColumns: 'max-content minmax(0, 1fr) max-content',
    columnGap: '_md',
  },
  row: {
    display: 'grid',
    gridColumn: '1 / -1',
    gridTemplateColumns: 'subgrid',
    alignItems: 'center',
    paddingBlock: '2px',
    paddingInline: '_xs',
    borderRadius: '_sm',
  },
  rowClickable: { backgroundColor: { default: 'transparent', ':hover': '_fill' } },
  label: { color: '_text', textAlign: 'end', whiteSpace: 'nowrap' },
  track: { display: 'flex', justifyContent: 'center' },
  bar: {
    height: '1.75rem',
    minWidth: '2px',
    borderRadius: '_sm',
    transition: `width ${t.durations.md} ${t.easings.standard}`,
  },
  value: { fontVariantNumeric: 'tabular-nums', fontWeight: '_medium', whiteSpace: 'nowrap' },
  // 环节之间：转化率写在中间那一列，小号的次要文字
  rate: {
    display: 'grid',
    gridColumn: '1 / -1',
    gridTemplateColumns: 'subgrid',
    paddingInline: '_xs',
    color: '_textMuted',
    fontSize: '_xs',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: '_tight',
  },
  rateText: { gridColumn: '2', textAlign: 'center' },
  overall: { gridColumn: '2 / 4', textAlign: 'center', paddingBlockStart: '_xs' },
  skeleton: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '_sm' },
  skeletonBar: { height: '1.75rem', borderRadius: '_sm' },
});

// 横条的宽度与颜色随数据变：单独一个 create（见 COMPONENTS.md §4）
/** FunnelChart 的样式：barSize、skeletonWidth */
export const funnelChartDynamicStyles = stylex.create({
  barSize: (width: string, color: string) => ({ width, backgroundColor: color }),
  skeletonWidth: (width: string) => ({ width }),
});

/** 骨架横条的宽度：从宽到窄 */
const SKELETON_WIDTHS = ['90%', '68%', '46%', '28%'];

/** 漏斗图 */
export const FunnelChart = _component(
  ({
    stages,
    valueFormat,
    unit,
    color = 'chart1',
    rates = true,
    loading = false,
    empty,
    onItemClick,
    ...rest
  }: FunnelChartProps) => {
    const lang = useLang();
    const format = useFormat();
    const numbers = _derived(stages.map((stage) => Math.max(toNumber(stage.value), 0)));
    const max = _derived(Math.max(0, ...numbers));
    const percent = (value: number) =>
      format.number(value, { style: 'percent', maximumFractionDigits: 1 });
    /** 第 index 个环节比 base 个环节的转化率；base 为 0 时没有 */
    const rate = (index: number, base: number) =>
      numbers[base] ? percent(numbers[index]! / numbers[base]!) : lang.emptyValue;
    const valueText = (stage: FunnelStage) =>
      format.number(stage.value, unit ? { ...valueFormat, suffix: unit } : valueFormat);

    return () => (
      <ChartFrame
        {...rest}
        unit={unit}
        height="auto"
        legend={[]}
        hiddenKeys={[]}
        onLegendToggle={() => {}}
        loading={loading}
        skeleton={
          <div aria-hidden="true" {...stylex.attrs(funnelChartStyles.skeleton)}>
            {SKELETON_WIDTHS.map((width) => (
              <Skeleton
                key={width}
                sx={[funnelChartStyles.skeletonBar, funnelChartDynamicStyles.skeletonWidth(width)]}
              />
            ))}
          </div>
        }
        isEmpty={stages.length === 0}
        empty={empty}
        table={{
          columns: [
            lang.chartStage,
            unit ? `${lang.chartValue}（${unit}）` : lang.chartValue,
            lang.chartStepRate,
            lang.chartOverallRate,
          ],
          rows: stages.map((stage, index) => ({
            header: stage.label,
            cells: [
              format.number(stage.value, valueFormat),
              index === 0 ? lang.emptyValue : rate(index, index - 1),
              index === 0 ? lang.emptyValue : rate(index, 0),
            ],
          })),
        }}
        plot={
          <div {...stylex.attrs(funnelChartStyles.list)}>
            {stages.map((stage, index) => [
              index > 0 && rates && (
                <div key={`rate-${index}`} {...stylex.attrs(funnelChartStyles.rate)}>
                  <span {...stylex.attrs(funnelChartStyles.rateText)}>
                    ↓ {rate(index, index - 1)}
                  </span>
                </div>
              ),
              <div
                key={`stage-${index}`}
                {...stylex.attrs(
                  funnelChartStyles.row,
                  onItemClick && funnelChartStyles.rowClickable,
                )}
                onClick={onItemClick && (() => onItemClick(stage, index))}
              >
                <span {...stylex.attrs(funnelChartStyles.label)}>{stage.label}</span>
                <span {...stylex.attrs(funnelChartStyles.track)}>
                  <span
                    {...stylex.attrs(
                      funnelChartStyles.bar,
                      funnelChartDynamicStyles.barSize(
                        max ? `${(numbers[index]! / max) * 100}%` : '0%',
                        resolveColor(stage.color ?? color, index),
                      ),
                    )}
                  />
                </span>
                <span {...stylex.attrs(funnelChartStyles.value)}>{valueText(stage)}</span>
              </div>,
            ])}
            {rates && stages.length > 1 && (
              <div {...stylex.attrs(funnelChartStyles.rate)}>
                <span {...stylex.attrs(funnelChartStyles.overall)}>
                  {lang.chartOverallRate} {rate(stages.length - 1, 0)}
                </span>
              </div>
            )}
          </div>
        }
        clickable={onItemClick != null}
      />
    );
  },
);
