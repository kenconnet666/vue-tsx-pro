/**
 * 审批单：单据的摘要（流程、发起人、时间、现在到哪）、我能做的（HandleTask）或只读的单据（SchemaView，按“旁观的人”的权限）、
 * 进度图、流转记录。数据变了（谁处理了、作业跑了）、换了演示身份都重新取。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { Incident, InstanceDetail, WorkItemDetail } from '@zerodep-dev/flow-ts-engine';
import { formManifest } from '@zerodep-dev/flow-ts-model';
import { manifestAccess, manifestSchema, toFormValues } from '@zerodep-dev/flow-ts-ui';
import {
  Alert,
  Badge,
  Card,
  Descriptions,
  Flex,
  H2,
  SchemaView,
  SkeletonText,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { getLocalTimeZone } from '@internationalized/date';
import { watch } from 'vue';
import { useFlowCenter } from '../runtime/center';
import { FlowTimeline } from './FlowTimeline';
import { HandleTask } from './HandleTask';
import { ProgressDiagram } from './ProgressDiagram';
import { RESULT_TEXT, STATUS, timeText, who } from './labels';

/** ApprovalPanel 的属性 */
export interface ApprovalPanelProps {
  instance: number;
  /** 从待办、已办点进来时的待办 */
  workItem?: number | null;
  /** 处理完了（工作台换到下一条） */
  onDone?: () => void;
}

/** 审批单 */
export const ApprovalPanel = _component(
  ({ instance, workItem = null, onDone = () => {} }: ApprovalPanelProps) => {
    const center = useFlowCenter();
    let detail = _state.raw<InstanceDetail | null>(null);
    let item = _state.raw<WorkItemDetail | null>(null);
    let incidents = _state.raw<readonly Incident[]>([]);
    let failed = _state('');

    watch(
      () => [instance, workItem, center.state.revision, center.state.actor] as const,
      async ([id, itemId]) => {
        try {
          const [nextDetail, nextItem, nextIncidents] = await Promise.all([
            center.client.instance(id),
            itemId ? center.client.workItem(itemId) : Promise.resolve(null),
            center.client.incidents(id),
          ]);
          detail = nextDetail;
          item = nextItem;
          incidents = nextIncidents;
          failed = '';
        } catch (error) {
          failed = error instanceof Error ? error.message : String(error);
        }
      },
      { immediate: true },
    );

    /** 只读的单据：不在待办里看的人按流程的 formView */
    function renderReadonly(current: InstanceDetail) {
      const manifest = formManifest(current.definition);
      if (Object.keys(manifest).length === 0) return null;
      const timeZone = getLocalTimeZone();
      const values = toFormValues(manifest, current.instance.variables, timeZone);
      const access = manifestAccess(manifest, {
        access: { default: 'readonly', fields: current.definition.settings?.formView ?? {} },
        values,
        timeZone,
      });
      return <SchemaView schema={manifestSchema(manifest)} values={values} access={access} />;
    }

    return () => {
      if (failed) return <Alert tone="danger" title="打不开这张单" description={failed} />;
      const current = detail;
      if (!current) return <SkeletonText lines={6} />;
      const { instance: row, definition } = current;
      const status = STATUS[row.status];
      // 收件箱里的候选人也能直接处理（“认领”在动作里）
      const handling = item?.completable && row.status === 'active';
      return (
        <Flex direction="column" gap="lg">
          <Flex direction="column" gap="sm">
            <Flex gap="sm" align="center" wrap>
              <H2>{row.title ?? definition.name}</H2>
              <Badge tone={status.tone}>
                {row.status === 'completed' && row.result
                  ? (RESULT_TEXT[row.result] ?? row.result)
                  : status.label}
              </Badge>
            </Flex>
            <Descriptions
              columns="auto"
              items={[
                { label: '流程', value: definition.name },
                { label: '发起人', value: who(row.startedBy) },
                { label: '发起时间', value: timeText(row.startedAt, center.state.now) },
                {
                  label: row.status === 'active' ? '现在到' : '结束于',
                  value:
                    row.status === 'active'
                      ? current.current.map((c) => c.name).join('、') || '—'
                      : timeText(row.endedAt, center.state.now),
                },
              ]}
            />
          </Flex>
          {incidents.length > 0 && (
            <Alert
              tone="danger"
              title="自动处理失败，等管理员处理"
              description={incidents.map((i) => `${i.nodeName ?? ''}：${i.error ?? ''}`).join('；')}
            />
          )}
          {handling && item ? (
            <Card padding="lg" header="我来处理">
              <HandleTask
                key={`${item.workItem.id}`}
                detail={current}
                item={item}
                onDone={onDone}
              />
            </Card>
          ) : (
            <Card padding="lg" header="单据">
              {renderReadonly(current)}
            </Card>
          )}
          <Card padding="md" header="进度">
            <ProgressDiagram detail={current} incidents={incidents} />
          </Card>
          <Card padding="md" header="流转记录">
            <FlowTimeline detail={current} now={center.state.now} />
          </Card>
        </Flex>
      );
    };
  },
);
