/**
 * 节点图的节点（材质、着色器、数据流、逻辑编排）：标题栏，下面一行一个端口——输出在右、输入在左，名字对着 Diagram 画的端口点；
 * 端口行下面可以放这个节点的参数（children）。端口的位置按行算（portNodeLayout），不量 DOM：节点的高度和每个端口的 at
 * 交给 Diagram 的节点数据，卡片里的行和端口点对得上。
 *
 *   const layout = portNodeLayout({ outputs, inputs, body: params.length * 30 });
 *   const nodes = [{ id, x, y, width: 190, ...layout }];   高、端口、有参数区时的 controls
 *   <Diagram nodes={nodes} edges={edges} routing="bezier">
 *     {(node) => <DiagramPortNode title="混合" outputs={outputs} inputs={inputs}><Params /></DiagramPortNode>}
 *   </Diagram>
 *
 * 选中、焦点的描边由 Diagram 画在节点框外。参数区里按下指针不拖节点（拖数值、选下拉框）。
 * 部件（data-scope="diagram-port-node"）：Root（div）、Header（标题栏）、Row（一行端口）、Body（参数区）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { partAttrs } from '../config/styles';
import { mergeAttrs, type PartProps } from '../utils/props';
import type { StatusTone } from '../utils/style/tone-styles';
import { diagramNodeToneStyles } from './DiagramNode';
import type { DiagramPortItem } from './ports';

/** 节点上的一个端口（一行） */
export interface PortNodePort {
  /** 端口的标识（连线的 fromPort、toPort） */
  id: string;
  /** 行里显示的名字，也是端口点的读屏名称 */
  label: string;
  /** 端口点的颜色（CSS 颜色）：按数据类型区分时用 */
  color?: string;
}

/** portNodeLayout 的选项：各部分的高度都是 px（Diagram 的坐标） */
export interface PortNodeLayoutOptions {
  /** 输出端口，排在前面（右边） */
  outputs?: readonly PortNodePort[];
  /** 输入端口，排在输出后面（左边） */
  inputs?: readonly PortNodePort[];
  /** 标题栏的高，默认 24 */
  header?: number;
  /** 一行端口的高，默认 20 */
  row?: number;
  /** 端口行下面参数区的高，默认 0（没有参数区） */
  body?: number;
  /** 节点的边框宽，默认 1：行从边框里面排起 */
  border?: number;
}

/** 节点的布局：交给 Diagram 的节点数据 */
export interface PortNodeLayout {
  /** 节点的高（px） */
  height: number;
  /** 端口：输出在右、输入在左，at 对准各自那一行的中间 */
  ports: DiagramPortItem[];
  /** 有参数区（里面放控件）：交给节点数据的 controls，节点框不当按钮 */
  controls: boolean;
}

/** 默认的标题栏、端口行的高（px） */
const HEADER = 24;
const ROW = 20;

/** 按行算节点的高和端口的位置：DiagramPortNode 用同样的数画行，端口点对着行 */
export function portNodeLayout({
  outputs = [],
  inputs = [],
  header = HEADER,
  row = ROW,
  body = 0,
  border = 1,
}: PortNodeLayoutOptions): PortNodeLayout {
  const height = header + (outputs.length + inputs.length) * row + body + 2 * border;
  const at = (index: number) => (border + header + (index + 0.5) * row) / height;
  const port = (item: PortNodePort, direction: 'in' | 'out', index: number): DiagramPortItem => ({
    id: item.id,
    direction,
    at: at(index),
    label: item.label,
    ...(item.color !== undefined ? { color: item.color } : {}),
  });
  return {
    height,
    controls: body > 0,
    ports: [
      ...outputs.map((item, i) => port(item, 'out', i)),
      ...inputs.map((item, i) => port(item, 'in', outputs.length + i)),
    ],
  };
}

/** 未声明的属性落到外层 div 上；原生的 title 属性让给标题 */
export interface DiagramPortNodeProps extends PartProps<'div', 'title'> {
  /** 标题 */
  title?: VNodeChild;
  /** 输出端口（右边，一行一个） */
  outputs?: readonly PortNodePort[];
  /** 输入端口（左边，一行一个） */
  inputs?: readonly PortNodePort[];
  /** 标题栏的高（px），默认 24；要和 portNodeLayout 的一致 */
  header?: number;
  /** 一行端口的高（px），默认 20；要和 portNodeLayout 的一致 */
  row?: number;
  /** 色调：底色与边框，默认 neutral */
  tone?: StatusTone;
  /** 标题栏的部件属性 */
  propsHeader?: PartProps<'div'>;
  /** 端口行的部件属性（每一行） */
  propsRow?: PartProps<'div'>;
  /** 参数区的部件属性 */
  propsBody?: PartProps<'div'>;
  /** 端口行下面的参数区 */
  children?: VNodeChild;
}

/** 部件的标记（data-scope="diagram-port-node"） */
const portNodePart = (part: string) => partAttrs({ name: 'DiagramPortNode' }, part);

/** DiagramPortNode 的样式：root、header、row、output、body */
const diagramPortNodeStyles = css.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
    color: '_text',
    lineHeight: '_tight',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderRadius: '_md',
    boxShadow: '_sm',
  },
  header: {
    flexShrink: 0,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    paddingInline: '_space.sm',
    fontWeight: '_semibold',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderBlockEndWidth: '_xs',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: '_borderMuted',
  },
  row: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    paddingInline: '_space.sm',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  // 输出在右边：名字靠右，对着右边的端口点
  output: { justifyContent: 'flex-end' },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '_space.xxs',
    paddingBlock: '_space.xs',
    paddingInline: '_space.xs',
    minHeight: 0,
  },
});

// 行高是 px 的任意值：单独一个 create，见 COMPONENTS.md §4
/** DiagramPortNode 的样式：height */
const diagramPortNodeSizeStyles = css.create({
  height: (px: number) => ({ height: `${px}px` }),
});

/** 节点图的节点：标题栏、一行一个端口（输出在右、输入在左）、参数区 */
export const DiagramPortNode = _component(
  ({
    title,
    outputs = [],
    inputs = [],
    header = HEADER,
    row = ROW,
    tone = 'neutral',
    propsHeader,
    propsRow,
    propsBody,
    children,
    ...rest
  }: DiagramPortNodeProps) => {
    const portRow = (port: PortNodePort, output: boolean) => (
      <div
        key={`${output ? 'out' : 'in'}:${port.id}`}
        {...mergeAttrs<'div'>(
          {
            sx: [
              diagramPortNodeStyles.row,
              output && diagramPortNodeStyles.output,
              diagramPortNodeSizeStyles.height(row),
            ],
            ...portNodePart('row'),
          },
          propsRow,
        )}
        data-direction={output ? 'out' : 'in'}
        // 端口的名字由 Diagram 的端口点和节点名称读出：行只是给眼睛看的
        aria-hidden="true"
      >
        {port.label}
      </div>
    );
    return () => (
      <div
        {...mergeAttrs<'div'>(
          {
            sx: [diagramPortNodeStyles.root, diagramNodeToneStyles[tone]],
            ...portNodePart('root'),
          },
          rest,
        )}
      >
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [diagramPortNodeStyles.header, diagramPortNodeSizeStyles.height(header)],
              ...portNodePart('header'),
            },
            propsHeader,
          )}
        >
          {title}
        </div>
        {outputs.map((port) => portRow(port, true))}
        {inputs.map((port) => portRow(port, false))}
        {children != null && children !== false && (
          <div
            {...mergeAttrs<'div'>(
              { sx: diagramPortNodeStyles.body, ...portNodePart('body') },
              propsBody,
              // 参数区里拖数值、选下拉框不是拖节点
              { onPointerdown: (event: PointerEvent) => event.stopPropagation() },
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  },
);
