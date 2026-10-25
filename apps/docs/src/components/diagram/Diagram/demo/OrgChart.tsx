// 组织架构：只看不改。节点的内容自己画（头像、姓名、岗位），连线是排好的折线；fitView 第一次就把整张图放进视口，
// 右下角的缩放按钮来自 DiagramControls。拖动空白处平移，滚轮平移，按住 Ctrl 滚轮或触控板捏合缩放
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Avatar, Small, Strong } from '@vue-tsx-pro/ui';
import {
  Diagram,
  DiagramControls,
  type DiagramEdgeItem,
  type DiagramNodeItem,
} from '@vue-tsx-pro/ui/diagram';

interface Person {
  id: string;
  name: string;
  title: string;
  manager?: string;
}

const people: Person[] = [
  { id: 'gm', name: '周明远', title: '总经理' },
  { id: 'buy', name: '林晓', title: '采购部 · 经理', manager: 'gm' },
  { id: 'qa', name: '陈思雨', title: '质量部 · 经理', manager: 'gm' },
  { id: 'fin', name: '王建国', title: '财务部 · 经理', manager: 'gm' },
  { id: 'buy-1', name: '赵一凡', title: '采购专员', manager: 'buy' },
  { id: 'buy-2', name: '孙悦', title: '采购专员', manager: 'buy' },
  { id: 'qa-1', name: '李想', title: '质量工程师', manager: 'qa' },
  { id: 'fin-1', name: '吴佳', title: '会计', manager: 'fin' },
  { id: 'fin-2', name: '郑一鸣', title: '出纳', manager: 'fin' },
];

const WIDTH = 176;
const HEIGHT = 60;
const GAP_X = 24;
const GAP_Y = 64;

type OrgNode = DiagramNodeItem & Person;

/** 从上往下的树：叶子按顺序排开，上级居中在下属上方 */
function layout(list: readonly Person[]) {
  const children = (id: string) => list.filter((person) => person.manager === id);
  const nodes: OrgNode[] = [];
  let next = 0;
  function place(person: Person, depth: number): number {
    const reports = children(person.id);
    const centers = reports.map((report) => place(report, depth + 1));
    const center = centers.length
      ? (centers[0]! + centers[centers.length - 1]!) / 2
      : next++ * (WIDTH + GAP_X) + WIDTH / 2;
    nodes.push({
      ...person,
      x: center - WIDTH / 2,
      y: depth * (HEIGHT + GAP_Y),
      width: WIDTH,
      height: HEIGHT,
    });
    return center;
  }
  list.filter((person) => !person.manager).forEach((root) => place(root, 0));
  // 上级的底边中点 → 往下一半 → 横到下属上方 → 下属的顶边中点
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const edges: DiagramEdgeItem[] = nodes
    .filter((node) => node.manager)
    .map((node) => {
      const parent = byId.get(node.manager!)!;
      const fromX = parent.x + WIDTH / 2;
      const toX = node.x + WIDTH / 2;
      const midY = parent.y + HEIGHT + GAP_Y / 2;
      return {
        id: `${parent.id}-${node.id}`,
        from: parent.id,
        to: node.id,
        points: [
          { x: fromX, y: parent.y + HEIGHT },
          { x: fromX, y: midY },
          { x: toX, y: midY },
          { x: toX, y: node.y },
        ],
      };
    });
  return { nodes, edges };
}

const { nodes, edges } = layout(people);

const styles = css.create({
  diagram: { height: '22rem' },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '_space.sm',
    paddingInline: '_space.sm',
    backgroundColor: '_surfaceRaised',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
    boxShadow: '_xs',
  },
  lead: { borderColor: '_accentBorder', backgroundColor: '_accentSoft' },
  text: { display: 'flex', flexDirection: 'column', minWidth: 0 },
});

export default _component(() => () => (
  <Diagram
    nodes={nodes}
    edges={edges}
    getNodeLabel={(person) => `${person.name}，${person.title}`}
    fitView
    overlay={<DiagramControls />}
    sx={styles.diagram}
    aria-label="组织架构"
  >
    {(person) => (
      <div {...css.attrs(styles.card, !person.manager && styles.lead)}>
        <Avatar name={person.name} size="sm" />
        <div {...css.attrs(styles.text)}>
          <Strong size="sm">{person.name}</Strong>
          <Small tone="muted">{person.title}</Small>
        </div>
      </div>
    )}
  </Diagram>
));
