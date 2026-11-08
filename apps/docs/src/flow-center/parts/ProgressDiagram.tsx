/**
 * 审批单的进度图：流程图（flow-ts-ui 的 processDiagram）标出走过的节点与连线、正在处理的（加光晕）、出错的（作业失败）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { InstanceDetail, Incident } from '@zerodep-dev/flow-ts-engine';
import { processDiagram, renderStep, stepLabel } from '@zerodep-dev/flow-ts-ui';
import { Diagram } from '@zerodep-dev/vue-tsx-pro-ui/diagram';

/** ProgressDiagram 的属性 */
export interface ProgressDiagramProps {
  detail: InstanceDetail;
  /** 这个实例上失败的作业：所在节点标成出错 */
  incidents?: readonly Incident[];
}

/** 进度图 */
export const ProgressDiagram = _component(({ detail, incidents = [] }: ProgressDiagramProps) => {
  return () => {
    // 走过的：发生过离开节点、走过连线的事件
    const done = new Set<string>();
    for (const event of detail.events) {
      if (event.type === 'node.left' && event.node) done.add(event.node);
      if (event.edge) done.add(event.edge);
    }
    const current = detail.current.map((c) => c.node);
    const failed = incidents.flatMap((incident) => (incident.node ? [incident.node] : []));
    const { nodes, edges } = processDiagram(detail.definition, {
      current,
      done: [...done],
      failed,
    });
    return (
      <Diagram
        nodes={nodes}
        edges={edges}
        getNodeLabel={stepLabel}
        edgeText={(flow) => flow.text}
        routing="orthogonal"
        fitView
        height="16rem"
        aria-label={`${detail.definition.name}的进度`}
      >
        {renderStep}
      </Diagram>
    );
  };
});
