/** 设计流程（要求 flow.admin）：从模板起步改，试运行看走到哪、停在谁那里，没问题就发布，发起页马上能用 */
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { Alert, Button, Flex, H1, Paragraph, Small } from '@zerodep-dev/vue-tsx-pro-ui';
import { ProcessDesigner } from '@zerodep-dev/flow-ts-ui';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { ActionError } from '@zerodep-dev/vue-tsx-pro-kit';
import { actions } from '../client.ts';

/** 试运行的结果，给人看的一行字 */
type Trial = Awaited<ReturnType<typeof actions.simulate>>;

export default _component(() => {
  let draft = _state.raw<ProcessDefinition | null>(null);
  let trial = _state.raw<Trial | null>(null);
  let message = _state('');
  let busy = _state(false);

  async function simulate(definition: ProcessDefinition) {
    busy = true;
    try {
      trial = await actions.simulate({ definition });
    } catch (error) {
      message = error instanceof ActionError ? error.message : String(error);
    } finally {
      busy = false;
    }
  }

  async function publish() {
    if (!draft) return;
    busy = true;
    try {
      const { key, version } = await actions.publish({ definition: draft });
      message = `已发布 ${key} 第 ${version} 版，发起页可以用了`;
    } catch (error) {
      message = error instanceof ActionError ? error.message : String(error);
    } finally {
      busy = false;
    }
  }

  return () => (
    <Flex direction="column" gap="lg">
      <H1>设计流程</H1>
      <ProcessDesigner _definition={draft} onSimulate={(definition) => void simulate(definition)} />
      {trial && (
        <Alert tone={trial.error ? 'warning' : 'info'} aria-label="试运行">
          {trial.error
            ? `试运行停在第 ${trial.error.step} 步：${trial.error.message}`
            : trial.open.length > 0
              ? `发起后停在：${trial.open.map((o) => `${o.nodeName}（等 ${o.assignee ?? o.candidates.join('、')}）`).join('；')}`
              : `直接走完了：${trial.result ?? trial.status}`}
        </Alert>
      )}
      {draft && (
        <Flex gap="sm" align="center">
          <Button disabled={busy} onClick={() => void publish()}>
            发布
          </Button>
          <Small>发布后定义不再改；再发布是新的版本，进行中的审批单按原来的版本走完。</Small>
        </Flex>
      )}
      {message && <Paragraph data-testid="design-message">{message}</Paragraph>}
    </Flex>
  );
});
