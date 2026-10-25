/**
 * 小地图：整张图的缩略（节点画成小方块）与当前视口的框，点或拖小地图把视口移过去。放在 Diagram 的 overlay 里：
 *
 *   <Diagram overlay={<><DiagramControls /><DiagramMinimap /></>} … />
 *
 * 只是指针用户的便利：键盘用户用视口的方向键平移，读屏不念它（aria-hidden）。
 * 部件：Root（div）、Node（每个节点的方块）、Viewport（视口的框）。
 */
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { startMove } from '../utils/dom/move';
import { mergeAttrs, type PartProps } from '../utils/props';
import { diagramInternals } from './controller';
import { DiagramContext } from './Diagram';
import { boundsOf } from './geometry';

/** 小地图放在画布的哪个角 */
export interface DiagramMinimapPlacements {
  /** 右下（从右到左时左下），默认 */
  'bottom-end': unknown;
  /** 左下 */
  'bottom-start': unknown;
  /** 右上 */
  'top-end': unknown;
  /** 左上 */
  'top-start': unknown;
}

/** 未声明的属性落到外层 div 上 */
export interface DiagramMinimapProps extends PartProps<'div'> {
  /** 放在画布的哪个角，默认 bottom-end */
  placement?: keyof DiagramMinimapPlacements;
  /** 宽（px），默认 168 */
  width?: number;
  /** 高（px），默认 112 */
  height?: number;
  /** 节点方块的部件属性 */
  propsNode?: PartProps<'rect'>;
  /** 视口框的部件属性 */
  propsViewport?: PartProps<'rect'>;
}

/** DiagramMinimap 的样式 */
export const diagramMinimapStyles = css.create({
  root: {
    position: 'absolute',
    pointerEvents: 'auto',
    overflow: 'hidden',
    backgroundColor: '_surface',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    boxShadow: '_sm',
    cursor: 'pointer',
    touchAction: 'none',
  },
  'bottom-end': { insetBlockEnd: '_space.sm', insetInlineEnd: '_space.sm' },
  'bottom-start': { insetBlockEnd: '_space.sm', insetInlineStart: '_space.sm' },
  'top-end': { insetBlockStart: '_space.sm', insetInlineEnd: '_space.sm' },
  'top-start': { insetBlockStart: '_space.sm', insetInlineStart: '_space.sm' },
  svg: { display: 'block' },
  node: { fill: '_borderStrong' },
  viewport: {
    fill: `color-mix(in srgb, currentColor 6%, transparent)`,
    stroke: '_accent',
    strokeWidth: 1.5,
    color: '_accent',
  },
});

/** 小地图 */
export const DiagramMinimap = _component(
  ({
    placement = 'bottom-end',
    width = 168,
    height = 112,
    propsNode,
    propsViewport,
    ...rest
  }: DiagramMinimapProps) => {
    const diagram = DiagramContext.inject();
    const internal = diagramInternals(diagram);
    let svg: SVGSVGElement | null = null;

    /** 视口在画布坐标里的范围 */
    const visible = () => {
      const { width: viewWidth, height: viewHeight } = internal.size.value;
      return {
        x: -diagram.x / diagram.scale,
        y: -diagram.y / diagram.scale,
        width: viewWidth / diagram.scale,
        height: viewHeight / diagram.scale,
      };
    };

    /** 把视口的中心移到小地图上点到的位置 */
    function centerAt(clientX: number, clientY: number) {
      const matrix = svg?.getScreenCTM()?.inverse();
      if (!matrix) return;
      const point = new DOMPoint(clientX, clientY).matrixTransform(matrix);
      const { width: viewWidth, height: viewHeight } = internal.size.value;
      internal.view.panTo(
        viewWidth / 2 - point.x * diagram.scale,
        viewHeight / 2 - point.y * diagram.scale,
      );
    }

    function onPointerdown(event: PointerEvent) {
      if (event.button !== 0) return;
      event.preventDefault();
      centerAt(event.clientX, event.clientY);
      startMove(event, { onMove: (point) => centerAt(point.clientX, point.clientY) });
    }

    return () => {
      const nodes = internal.nodes();
      const view = visible();
      // 视口也算进范围：拖到很远时框也一直看得见
      const frame = boundsOf([...nodes, view]) ?? { x: 0, y: 0, width: 1, height: 1 };
      const pad = Math.max(frame.width, frame.height) * 0.04;
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [diagramMinimapStyles.root, diagramMinimapStyles[placement]] },
            rest,
            { 'aria-hidden': 'true', onPointerdown },
          )}
        >
          <svg
            ref={(element: unknown) => (svg = element as SVGSVGElement | null)}
            {...css.attrs(diagramMinimapStyles.svg)}
            width={width}
            height={height}
            viewBox={`${frame.x - pad} ${frame.y - pad} ${frame.width + pad * 2} ${frame.height + pad * 2}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {nodes.map((node, index) => (
              <rect
                key={index}
                {...mergeAttrs<'rect'>({ sx: diagramMinimapStyles.node }, propsNode, {
                  x: node.x,
                  y: node.y,
                  width: node.width,
                  height: node.height,
                  rx: Math.min(node.width, node.height) * 0.12,
                })}
              />
            ))}
            <rect
              {...mergeAttrs<'rect'>({ sx: diagramMinimapStyles.viewport }, propsViewport, {
                x: view.x,
                y: view.y,
                width: view.width,
                height: view.height,
                // 小地图按比例缩得很小，描边不跟着缩
                'vector-effect': 'non-scaling-stroke',
              })}
            />
          </svg>
        </div>
      );
    };
  },
);
