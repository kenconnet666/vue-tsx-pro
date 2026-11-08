/**
 * 工作室的“图”：画布点选环节、拖动摆位置，右边改环节的设置；工具栏加审批环节、金额分支、子流程、抄送，删一步、重新排版。
 * 流程的增删改都交给模型包的编辑函数，改完的定义经 onChange 交回（工作室写回 process.json）。
 * 问题列表点一下定位到环节（focus 由外面传进来）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  addAmountBranch,
  addApprovalStep,
  addCallStep,
  addCcStep,
  removeStep,
  type ProcessDefinition,
} from '@zerodep-dev/flow-ts-model';
import { NodePanel, processDiagram, renderStep, stepLabel, without } from '@zerodep-dev/flow-ts-ui';
import { Alert, Button, Card, Flex } from '@zerodep-dev/vue-tsx-pro-ui';
import {
  Diagram,
  DiagramControls,
  useDiagram,
  type DiagramNodeMove,
  type DiagramSelection,
} from '@zerodep-dev/vue-tsx-pro-ui/diagram';
import { watch } from 'vue';
import { ROLE } from '../domain/org';

/** ProcessCanvas 的属性 */
export interface ProcessCanvasProps {
  definition: ProcessDefinition;
  /** 调用流程时能选的流程 */
  processes: readonly { value: string; label: string }[];
  /** 定位到这个环节（问题列表点的）；每次换一个新对象才触发 */
  focus?: { node: string } | null;
  onChange: (definition: ProcessDefinition) => void;
}

const styles = css.create({
  workspace: { display: 'flex', flexWrap: 'wrap', gap: '_lg', alignItems: 'flex-start' },
  canvas: { flex: '1 1 28rem', minWidth: 0 },
  panel: { flex: '1 1 16rem', maxWidth: '24rem' },
});

export const ProcessCanvas = _component(
  ({ definition, processes, focus = null, onChange }: ProcessCanvasProps) => {
    const diagram = useDiagram({ maxScale: 1.5 });
    let selection = _state<DiagramSelection>({ nodes: [], edges: [] });
    let problem = _state('');

    const view = _derived(processDiagram(definition));
    const selected = _derived(
      selection.nodes.length === 1
        ? (definition.nodes.find((n) => n.id === selection.nodes[0]) ?? null)
        : null,
    );

    /** 改定义：编辑函数报错时（比如分支加在了分叉的地方）把原因显示出来 */
    function change(edit: (current: ProcessDefinition) => ProcessDefinition) {
      try {
        onChange(edit(definition));
        problem = '';
      } catch (error) {
        problem = error instanceof Error ? error.message : String(error);
      }
    }

    /** 拖动后的位置存进定义的 layout（引擎不读，只给画布） */
    function move(moves: DiagramNodeMove[]) {
      change((current) => ({
        ...current,
        layout: {
          ...current.layout,
          nodes: {
            ...current.layout?.nodes,
            ...Object.fromEntries(moves.map(({ id, x, y }) => [id, { x, y }])),
          },
        },
      }));
    }

    watch(
      () => focus,
      (target) => {
        const step = target && view.nodes.find((n) => n.id === target.node);
        if (!step) return;
        diagram.reveal(step, 48);
        selection = { nodes: [step.id], edges: [] };
      },
    );

    /** 新环节加在选中的之后，没选时加在开始之后 */
    const after = () =>
      selected?.id ?? definition.nodes.find((n) => n.type === 'start')?.id ?? 'start';

    return () => (
      <Flex direction="column" gap="md">
        <Flex gap="sm" wrap align="center">
          <Button
            size="sm"
            onClick={() =>
              change((d) =>
                addApprovalStep(d, after(), { name: '新的审批', assignees: [{ role: ROLE.head }] }),
              )
            }
          >
            加审批环节
          </Button>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              change((d) =>
                addAmountBranch(d, after(), {
                  field:
                    d.variables?.find((v) => v.type === 'number' || v.type === 'decimal')?.name ??
                    'amount',
                  over: 10000,
                  step: { name: '加审', assignees: [{ role: ROLE.ceo }] },
                }),
              )
            }
          >
            加金额分支
          </Button>
          <Button
            size="sm"
            variant="soft"
            disabled={processes.length === 0}
            onClick={() =>
              change((d) =>
                addCallStep(d, after(), { name: '调用流程', process: processes[0]!.value }),
              )
            }
          >
            加子流程
          </Button>
          <Button
            size="sm"
            variant="soft"
            onClick={() =>
              change((d) => addCcStep(d, after(), { name: '抄送', to: [{ role: ROLE.hr }] }))
            }
          >
            加抄送
          </Button>
          <Button
            size="sm"
            variant="ghost"
            tone="danger"
            disabled={!selected || selected.type === 'start' || selected.type === 'end'}
            onClick={() => {
              const id = selected!.id;
              change((d) => removeStep(d, id));
              selection = { nodes: [], edges: [] };
            }}
          >
            删除这一步
          </Button>
          <Button
            size="sm"
            variant="ghost"
            tone="neutral"
            disabled={!definition.layout}
            onClick={() => change((d) => without(d, 'layout'))}
          >
            重新排版
          </Button>
        </Flex>
        {problem && <Alert tone="warning" description={problem} onClose={() => (problem = '')} />}
        <div {...css.attrs(styles.workspace)}>
          <Diagram
            controller={diagram}
            nodes={view.nodes}
            edges={view.edges}
            getNodeLabel={stepLabel}
            edgeText={(flow) => flow.text}
            routing="orthogonal"
            selectable
            _selected={selection}
            draggable
            snapToGrid
            onNodesMove={move}
            grid="dots"
            fitView
            height="28rem"
            overlay={<DiagramControls />}
            aria-label={`${definition.name}（设计中）`}
            sx={styles.canvas}
          >
            {renderStep}
          </Diagram>
          <Card padding="md" header="环节设置" sx={styles.panel}>
            <NodePanel
              definition={definition}
              node={selected}
              processes={processes}
              onChange={change}
            />
          </Card>
        </div>
      </Flex>
    );
  },
);
