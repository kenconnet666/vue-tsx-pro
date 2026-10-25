// 选择与框选：dragMode="select" 时拖动空白处框选（按住空格拖动或滚轮平移），按住 Shift / Ctrl 点选加选；
// _selected 双向绑定，侧栏列出选中的节点与连线。连线没给折线时画成两个节点之间的直线，edgeText 写月供货量。
// 节点按类型换图标与色调（DiagramNode 的 start、tone）
import { Factory, Truck, Warehouse } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import {
  AsideLayout,
  Button,
  Card,
  Flex,
  Icon,
  ItemList,
  ItemListItem,
  Small,
} from '@vue-tsx-pro/ui';
import {
  Diagram,
  DiagramControls,
  DiagramNode,
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

const kinds = {
  供应商: { icon: Truck, tone: 'info' },
  工厂: { icon: Factory, tone: 'accent' },
  仓库: { icon: Warehouse, tone: 'success' },
} as const;

export default _component(() => {
  let selection = _state<DiagramSelection>({ nodes: [], edges: [] });
  const nameOf = (id: string) => sites.find((item) => item.id === id)?.name ?? id;
  return () => (
    <AsideLayout
      asideWidth="16rem"
      sticky={false}
      aside={
        <Card header="选中的">
          {selection.nodes.length + selection.edges.length === 0 ? (
            <Small tone="muted">点节点或连线；拖动空白处框选，Ctrl / ⌘ + A 全选，Esc 清空</Small>
          ) : (
            <Flex direction="column" gap="sm">
              <ItemList density="compact">
                {selection.nodes.map((id) => (
                  <ItemListItem key={id} title={nameOf(id)} />
                ))}
                {selection.edges.map((id) => {
                  const lane = lanes.find((item) => item.id === id)!;
                  return (
                    <ItemListItem
                      key={id}
                      title={`${nameOf(lane.from)} → ${nameOf(lane.to)}`}
                      description={`${lane.volume.toLocaleString()} 件/月`}
                    />
                  );
                })}
              </ItemList>
              <Button
                size="sm"
                variant="soft"
                onClick={() => (selection = { nodes: [], edges: [] })}
              >
                清空
              </Button>
            </Flex>
          )}
        </Card>
      }
      asideLabel="选中的节点与连线"
    >
      <Diagram
        nodes={sites}
        edges={lanes}
        getNodeLabel={(item) => `${item.name}，${item.kind}`}
        edgeText={(lane) => `${lane.volume.toLocaleString()} 件/月`}
        selectable
        _selected={selection}
        dragMode="select"
        selectionMode="partial"
        grid="dots"
        fitView
        height="22rem"
        overlay={<DiagramControls />}
        aria-label="供货网络"
      >
        {(item) => (
          <DiagramNode
            start={<Icon icon={kinds[item.kind].icon} size="lg" />}
            title={item.name}
            description={item.kind}
            tone={kinds[item.kind].tone}
            align="start"
          />
        )}
      </Diagram>
    </AsideLayout>
  );
});
