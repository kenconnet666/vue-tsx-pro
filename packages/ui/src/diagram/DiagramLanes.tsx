/**
 * 泳道：虚线框出的一组横向泳道，左边一栏是泳道名（岗位、部门、系统），不着底色（画布的网格透过来）。放在 Diagram 的 backdrop 里，
 * 用画布坐标、随视口平移缩放；extent 写上泳道的范围，适应画布时整个放进来：
 *
 *   const lanes = [{ name: '申请人' }, { name: '部门经理' }, { name: '财务', size: 160 }];
 *   <Diagram backdrop={<DiagramLanes lanes={lanes} width={860} />} extent={lanesExtent(lanes, { width: 860 })} … />
 *
 * 泳道从 (x, y) 开始往下排，每条的高是它的 size，没写时用 laneSize；节点的纵坐标落在哪条泳道的范围里由使用方排。
 * 部件：Root（div）、Lane（每条泳道）、Header（泳道名）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import type { VNodeChild } from 'vue';
import { mergeAttrs, type PartProps } from '../utils/props';
import type { DiagramRect } from './geometry';

/** 一条泳道 */
export interface DiagramLane {
  /** 泳道名 */
  name: VNodeChild;
  /** 这条泳道的高（画布坐标）；不写时用 DiagramLanes 的 laneSize */
  size?: number;
}

/** 泳道的排法：起点、长度与默认的高 */
export interface DiagramLanesLayout {
  /** 泳道的长度（含泳道名那一栏，画布坐标） */
  width: number;
  /** 没写 size 的泳道的高，默认 120 */
  laneSize?: number;
  /** 左上角的横坐标，默认 0 */
  x?: number;
  /** 左上角的纵坐标，默认 0 */
  y?: number;
}

/** 未声明的属性落到外层 div 上 */
export interface DiagramLanesProps extends PartProps<'div'>, DiagramLanesLayout {
  /** 泳道，从上往下 */
  lanes: readonly DiagramLane[];
  /** 泳道名那一栏的宽（画布坐标），默认 88 */
  header?: number;
  /** 每条泳道的部件属性 */
  propsLane?: PartProps<'div'>;
  /** 泳道名的部件属性 */
  propsHeader?: PartProps<'div'>;
}

/** 泳道整体占的范围（画布坐标）：交给 Diagram 的 extent */
export function lanesExtent(
  lanes: readonly DiagramLane[],
  { width, laneSize = 120, x = 0, y = 0 }: DiagramLanesLayout,
): DiagramRect {
  const height = lanes.reduce((sum, lane) => sum + (lane.size ?? laneSize), 0);
  return { x, y, width, height };
}

/** DiagramLanes 的样式：root、lane、header */
export const diagramLanesStyles = css.create({
  // 虚线、不着底色：画布的点阵透过来，泳道只是分区，不像一张压在画布上的表
  root: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: '_md',
    // 外框用 outline 画：不占位置，泳道的坐标与 lanesExtent 一致
    outlineWidth: '_xs',
    outlineStyle: 'dashed',
    outlineColor: '_borderStrong',
  },
  lane: {
    display: 'flex',
    boxSizing: 'border-box',
    borderBlockEndWidth: { default: '_xs', ':last-child': 0 },
    borderBlockEndStyle: 'dashed',
    borderBlockEndColor: '_borderStrong',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
    paddingInline: '_space.xs',
    textAlign: 'center',
    fontWeight: '_semibold',
    color: '_textMuted',
    borderInlineEndWidth: '_xs',
    borderInlineEndStyle: 'dashed',
    borderInlineEndColor: '_borderStrong',
  },
});

/** 随数据变的样式：位置与大小 */
export const diagramLanesDynamicStyles = css.create({
  at: (x: number, y: number) => ({ transform: `translate(${x}px, ${y}px)` }),
  width: (width: number) => ({ width }),
  height: (height: number) => ({ height }),
});

/** 泳道 */
export const DiagramLanes = _component(
  ({
    lanes,
    width,
    laneSize = 120,
    x = 0,
    y = 0,
    header = 88,
    propsLane,
    propsHeader,
    ...rest
  }: DiagramLanesProps) =>
    () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [
              diagramLanesStyles.root,
              diagramLanesDynamicStyles.at(x, y),
              diagramLanesDynamicStyles.width(width),
            ],
          },
          rest,
        )}
      >
        {lanes.map((lane, index) => (
          <div
            key={index}
            {...mergeAttrs<'div'>(
              {
                sx: [
                  diagramLanesStyles.lane,
                  diagramLanesDynamicStyles.height(lane.size ?? laneSize),
                ],
              },
              propsLane,
            )}
          >
            <div
              {...mergeAttrs<'div'>(
                { sx: [diagramLanesStyles.header, diagramLanesDynamicStyles.width(header)] },
                propsHeader,
              )}
            >
              {lane.name}
            </div>
          </div>
        ))}
      </div>
    ),
);
