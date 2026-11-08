/**
 * 工作室的试运行：拿工作副本（没发布的也行）在 Worker 里另一个内存库上跑——组织、解析器、自动动作同流程中心，
 * 已发布的别的流程也在（合同调付款能跑）。选发起人、填单据，跑出走过的路、停在哪、等谁；
 * 每个开着的待办给出它的结果按钮，点了把这一步加上、从头重跑（试运行是确定的，等于一步步审下去）。
 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { SimulationResult, SimulationStep } from '@zerodep-dev/flow-ts-engine/testing';
import type { FormManifest, ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  Flex,
  ItemList,
  ItemListItem,
  Select,
  Small,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { CodeEditor } from '@zerodep-dev/vue-tsx-pro-ui/code-editor';
import { eventText, RESULT_TEXT, STATUS, who } from '../parts/labels';
import { showError } from '../parts/toaster';
import { useFlowCenter } from '../runtime/center';

/** TrialRun 的属性 */
export interface TrialRunProps {
  files: Readonly<Record<string, string>>;
  definition: ProcessDefinition;
  /** 单据的字段（给单据一个能跑的初始值） */
  manifest: FormManifest | undefined;
}

const styles = css.create({
  layout: {
    display: 'grid',
    gap: '_lg',
    gridTemplateColumns: { default: '1fr', '@media (min-width: 64rem)': '22rem minmax(0, 1fr)' },
    alignItems: 'start',
  },
  editor: { height: '14rem' },
});

/** 按字段类型给一个能通过检查的初始值：必填的有值，明细表一行 */
function sampleOf(manifest: FormManifest): Record<string, unknown> {
  const today = new Date().toISOString().slice(0, 10);
  const sample = (field: FormManifest[string]): unknown => {
    switch (field.type) {
      case 'text':
        return field.label;
      case 'number':
        return Number(field.min ?? 1);
      case 'decimal':
        return String(field.min ?? '100');
      case 'boolean':
        return false;
      case 'date':
        return today;
      case 'datetime':
        return `${today}T09:00:00Z`;
      case 'select':
        return Array.isArray(field.options) ? (field.options[0]?.value ?? null) : null;
      case 'list':
        return [sampleOf(field.fields ?? {})];
      default:
        return field.required ? [] : null;
    }
  };
  return Object.fromEntries(Object.entries(manifest).map(([name, field]) => [name, sample(field)]));
}

export const TrialRun = _component(({ files, definition, manifest }: TrialRunProps) => {
  const center = useFlowCenter();
  let initiator = _state(center.state.actor);
  let variables = _state(JSON.stringify(manifest ? sampleOf(manifest) : {}, null, 2));
  let steps = _state.raw<readonly SimulationStep[]>([]);
  let result = _state.raw<SimulationResult | null>(null);
  let running = _state(false);
  let problem = _state('');

  const nodeName = (id: string | null) =>
    definition.nodes.find((n) => n.id === id)?.name ?? id ?? '';

  async function run(next: readonly SimulationStep[]) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(variables) as Record<string, unknown>;
    } catch (error) {
      problem = `单据的 JSON 写得不对：${error instanceof Error ? error.message : String(error)}`;
      return;
    }
    problem = '';
    running = true;
    try {
      const actor = await center.call('actorOf', initiator);
      result = await center.call('simulate', {
        project: { files },
        input: { variables: parsed, steps: next, ...(actor ? { initiator: actor } : {}) },
      });
      steps = next;
    } catch (error) {
      showError(error);
    } finally {
      running = false;
    }
  }

  /** 开着的待办上能按的结果 */
  const outcomesOf = (node: string) => {
    const found = definition.nodes.find((n) => n.id === node);
    return found?.type === 'task' ? found.outcomes : [];
  };

  function renderResult(current: SimulationResult) {
    const status =
      current.status === 'not-started'
        ? { label: '没发起成', tone: 'danger' as const }
        : STATUS[current.status];
    return (
      <Flex direction="column" gap="md">
        <Flex gap="sm" align="center" wrap>
          <Badge tone={status.tone}>
            {current.status === 'completed' && current.result
              ? (RESULT_TEXT[current.result] ?? current.result)
              : status.label}
          </Badge>
          <Small tone="muted">{steps.length === 0 ? '刚发起' : `处理了 ${steps.length} 步`}</Small>
          {steps.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              tone="neutral"
              onClick={() => void run(steps.slice(0, -1))}
            >
              退一步
            </Button>
          )}
        </Flex>
        {current.current.length > 0 && (
          <Flex gap="sm" align="center" wrap>
            <Small>现在到：{current.current.map((c) => nodeName(c.node)).join('、')}</Small>
            {/* 定时、时限、异步动作要等作业：拨一小时，跑到点的 */}
            <Button
              size="sm"
              variant="outline"
              tone="neutral"
              disabled={running}
              onClick={() => void run([...steps, { wait: { hours: 1 } }])}
            >
              时间往后拨 1 小时
            </Button>
          </Flex>
        )}
        {current.error && (
          <Alert
            tone="danger"
            title={current.error.step === 0 ? '发起时出错' : `第 ${current.error.step} 步出错`}
            description={current.error.message}
          />
        )}
        {current.open.length > 0 && (
          <Card padding="md" header="停在这里，等人处理">
            <ItemList>
              {current.open.map((item, index) => (
                <ItemListItem
                  key={`${item.node}-${index}`}
                  title={item.nodeName}
                  description={
                    item.assignee
                      ? `等 ${who(item.assignee)}`
                      : `收件箱：${item.candidates.join('、') || '没有候选'}`
                  }
                  end={
                    <Flex gap="xs" wrap>
                      {outcomesOf(item.node).map((outcome) => (
                        <Button
                          key={outcome.key}
                          size="sm"
                          variant={(outcome.kind ?? 'approve') === 'approve' ? 'soft' : 'ghost'}
                          tone={
                            outcome.kind === 'reject' || outcome.kind === 'terminate'
                              ? 'danger'
                              : 'accent'
                          }
                          disabled={running}
                          onClick={() =>
                            void run([
                              ...steps,
                              {
                                node: item.node,
                                outcome: outcome.key,
                                ...(outcome.comment === 'required' ? { comment: '试运行' } : {}),
                              },
                            ])
                          }
                        >
                          {outcome.label}
                        </Button>
                      ))}
                    </Flex>
                  }
                />
              ))}
            </ItemList>
          </Card>
        )}
        <Card padding="md" header="走过的路">
          <ItemList density="compact">
            {current.path
              .filter((event) => eventText(event))
              .map((event, index) => (
                <ItemListItem
                  key={index}
                  title={`${eventText(event)}${event.node ? ` · ${nodeName(event.node)}` : ''}${event.outcome ? `（${event.outcome}）` : ''}`}
                  description={
                    // 试运行里替人处理的身份是 simulator
                    event.actor === 'simulator' ? '试运行' : event.actor ? who(event.actor) : '系统'
                  }
                />
              ))}
          </ItemList>
        </Card>
      </Flex>
    );
  }

  return () => (
    <div {...css.attrs(styles.layout)}>
      <Card padding="md" header="发起">
        <Flex direction="column" gap="md">
          <Field label="发起人">
            <Select items={center.people()} _value={initiator} />
          </Field>
          <Field label="单据（JSON）" description="字段按单据的清单填好了样例，改成想试的值">
            <CodeEditor _value={variables} aria-label="试运行的单据" sx={styles.editor} />
          </Field>
          {problem && <Alert tone="danger" description={problem} />}
          <Button loading={running} onClick={() => void run([])}>
            从头试运行
          </Button>
          <Small tone="muted">
            试运行在另一个内存库里跑，不影响流程中心的数据；没发布的改动也能试。
          </Small>
        </Flex>
      </Card>
      <div>
        {result ? (
          renderResult(result)
        ) : (
          <Small tone="muted">选好发起人、填好单据，点“从头试运行”。</Small>
        )}
      </div>
    </div>
  );
});
