/**
 * 审批单：单据的摘要（流程、发起人、时间、现在到哪）、对整张单的动作（InstanceActions：撤回、催办、留言、管理员的干预）、
 * 我能做的（HandleTask）或只读的单据（SchemaView，按“旁观的人”的权限）、流程工程的视图（views/*.tsx 的分区，有打印页时可以打印）、
 * 进度图、流转记录。数据变了（谁处理了、作业跑了）、换了演示身份都重新取。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { Incident, InstanceDetail, WorkItemDetail } from '@zerodep-dev/flow-ts-engine';
import { formManifest } from '@zerodep-dev/flow-ts-model';
import { manifestAccess, manifestSchema, toFormValues } from '@zerodep-dev/flow-ts-ui';
import {
  Alert,
  Badge,
  Button,
  Card,
  Descriptions,
  Dialog,
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
import { InstanceActions } from './InstanceActions';
import { printElement, processViews, ViewSection, type ProcessViews } from './process-views';
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
    /** 这张单按的那一版的视图；取不到时写原因 */
    let views = _state.raw<ProcessViews | null>(null);
    let viewsFailed = _state('');
    let printing = _state(false);
    let printArea = _state.raw<HTMLElement | null>(null);

    watch(
      () => detail && ([detail.instance.processKey, detail.instance.version] as const),
      async (next) => {
        if (!next) return;
        try {
          views = await processViews(center.client, next[0], next[1]);
          viewsFailed = '';
        } catch (error) {
          viewsFailed = error instanceof Error ? error.message : String(error);
        }
      },
    );

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

    /** 交给视图的：单据的值与这张单的概况 */
    const viewProps = (current: InstanceDetail) => ({
      variables: current.instance.variables as Record<string, unknown>,
      instance: {
        id: current.instance.id,
        title: current.instance.title,
        status: current.instance.status,
        current: current.instance.current,
      },
    });

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
            <Flex gap="xs" wrap align="center">
              <InstanceActions detail={current} incidents={incidents} />
              {views?.print && (
                <Button size="sm" variant="ghost" tone="neutral" onClick={() => (printing = true)}>
                  打印
                </Button>
              )}
            </Flex>
          </Flex>
          {incidents.length > 0 && (
            <Alert
              tone="danger"
              title={
                current.actions.manage
                  ? '自动处理失败：重试，或跳过往下走'
                  : '自动处理失败，等管理员处理'
              }
              description={incidents.map((i) => `${i.nodeName ?? ''}：${i.error ?? ''}`).join('；')}
            />
          )}
          {handling && item ? (
            <Card
              padding="lg"
              header={
                item.workItem.proxyFor
                  ? `我来处理（代${who(item.workItem.proxyFor)}，他设了代理）`
                  : '我来处理'
              }
            >
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
          {viewsFailed && (
            <Alert tone="danger" title="这个流程的视图加载不了" description={viewsFailed} />
          )}
          {views?.sections.map((view) => (
            <ViewSection key={view.path} view={view} props={viewProps(current)} />
          ))}
          {views?.print && (
            <Dialog
              _open={printing}
              size="lg"
              title={views.print.title}
              footer={<Button onClick={() => printArea && printElement(printArea)}>打印</Button>}
            >
              <div ref={(element: unknown) => (printArea = element as HTMLElement | null)}>
                <ViewSection view={views.print} props={viewProps(current)} bare />
              </div>
            </Dialog>
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
