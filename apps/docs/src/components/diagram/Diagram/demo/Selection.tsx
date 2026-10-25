// 选择与框选：dragMode="select" 时拖动空白处框选（按住空格拖动或滚轮平移），按住 Shift / Ctrl 点选加选；
// _selected 双向绑定，右边列出选中的节点与连线。连线没给折线时画成两个节点之间的直线，edgeText 写月供货量
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Badge, Button, Card, Flex, Small, Strong } from '@vue-tsx-pro/ui';
import {
  Diagram,
  DiagramControls,
  type DiagramEdgeItem,
  type DiagramNodeItem,
  type DiagramSelection,
} from '@vue-tsx-pro/ui/diagram';

interface Site extends DiagramNodeItem {
  name: string;
  kind: '供应商' | '工厂' | '仓库';
}

interface Lane extends DiagramEdgeItem {
  /** 月供货量（件） */
  volume: number;
}

const site = (id: string, name: string, kind: Site['kind'], x: number, y: number): Site => ({
  id,
  name,
  kind,
  x,
  y,
  width: 132,
  height: 52,
});

const sites: Site[] = [
  site('s1', '供应商甲', '供应商', 0, 0),
  site('s2', '供应商乙', '供应商', 0, 120),
  site('s3', '供应商丙', '供应商', 0, 240),
  site('f1', '一号工厂', '工厂', 260, 50),
  site('f2', '二号工厂', '工厂', 260, 190),
  site('w1', '华东仓', '仓库', 520, 50),
  site('w2', '华南仓', '仓库', 520, 190),
];

const lanes: Lane[] = [
  { id: 's1-f1', from: 's1', to: 'f1', volume: 1200 },
  { id: 's2-f1', from: 's2', to: 'f1', volume: 800 },
  { id: 's2-f2', from: 's2', to: 'f2', volume: 600 },
  { id: 's3-f2', from: 's3', to: 'f2', volume: 1500 },
  { id: 'f1-w1', from: 'f1', to: 'w1', volume: 1800 },
  { id: 'f1-w2', from: 'f1', to: 'w2', volume: 200 },
  { id: 'f2-w2', from: 'f2', to: 'w2', volume: 2100 },
];

const tones = { 供应商: 'info', 工厂: 'accent', 仓库: 'success' } as const;

const styles = css.create({
  diagram: { flexGrow: 1, flexShrink: 1, flexBasis: '30rem', minWidth: 0, height: '22rem' },
  panel: { flexGrow: 0, flexShrink: 1, flexBasis: '15rem' },
  site: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '2px',
    paddingInline: '_space.sm',
    backgroundColor: '_surfaceRaised',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_border',
    borderRadius: '_md',
  },
  list: { margin: 0, paddingInlineStart: '1.2em' },
});

export default _component(() => {
  let selection = _state<DiagramSelection>({ nodes: [], edges: [] });
  const nameOf = (id: string) => sites.find((item) => item.id === id)?.name ?? id;
  return () => (
    <Flex gap="md" wrap align="stretch">
      <Diagram
        nodes={sites}
        edges={lanes}
        getNodeLabel={(item) => `${item.kind}：${item.name}`}
        edgeText={(lane) => `${lane.volume.toLocaleString()} 件/月`}
        selectable
        _selected={selection}
        dragMode="select"
        selectionMode="partial"
        grid="dots"
        fitView
        overlay={<DiagramControls />}
        sx={styles.diagram}
        aria-label="供货网络"
      >
        {(item) => (
          <div {...css.attrs(styles.site)}>
            <Strong size="sm">{item.name}</Strong>
            <Badge tone={tones[item.kind]} variant="soft" size="sm">
              {item.kind}
            </Badge>
          </div>
        )}
      </Diagram>
      <Card sx={styles.panel} header="选中的">
        {selection.nodes.length + selection.edges.length === 0 ? (
          <Small tone="muted">点节点或连线；拖动空白处框选，Ctrl / ⌘ + A 全选，Esc 清空</Small>
        ) : (
          <Flex direction="column" gap="sm">
            <ul {...css.attrs(styles.list)}>
              {selection.nodes.map((id) => (
                <li key={id}>{nameOf(id)}</li>
              ))}
              {selection.edges.map((id) => {
                const lane = lanes.find((item) => item.id === id)!;
                return (
                  <li key={id}>
                    {nameOf(lane.from)} → {nameOf(lane.to)}（{lane.volume} 件/月）
                  </li>
                );
              })}
            </ul>
            <Button size="sm" variant="soft" onClick={() => (selection = { nodes: [], edges: [] })}>
              清空
            </Button>
          </Flex>
        )}
      </Card>
    </Flex>
  );
});
