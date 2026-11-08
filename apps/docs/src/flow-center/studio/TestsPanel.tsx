/**
 * 工作室的“测试”：跑工程 test.ts 里的场景（defineScenarios）——在 Worker 里另一个内存库上逐个试运行、对照期望，
 * 通过的打勾，不通过的写出哪里不一样；用的是工作副本，没发布的改动也能测。还没有 test.ts 时给一个样板。
 */
import { CircleCheck, CircleX } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import type { ScenarioResult } from '@zerodep-dev/flow-ts-engine/testing';
import {
  Alert,
  Badge,
  Button,
  Flex,
  Icon,
  ItemList,
  ItemListItem,
  Small,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { STATUS } from '../parts/labels';
import { useFlowCenter } from '../runtime/center';
import { TEST_FILE } from './project';

/** TestsPanel 的属性 */
export interface TestsPanelProps {
  files: Readonly<Record<string, string>>;
  /** 加上 test.ts（样板）并打开它 */
  onCreate: () => void;
}

export const TestsPanel = _component(({ files, onCreate }: TestsPanelProps) => {
  const center = useFlowCenter();
  let results = _state.raw<readonly ScenarioResult[] | null>(null);
  let running = _state(false);
  let failed = _state('');

  async function run() {
    running = true;
    failed = '';
    try {
      results = await center.call('runTests', { project: { files } });
    } catch (error) {
      failed = error instanceof Error ? error.message : String(error);
    } finally {
      running = false;
    }
  }

  /** 场景最后停在哪（通过时给人看一眼走到了哪） */
  const summary = (result: ScenarioResult) => {
    const { run: trial } = result;
    if (trial.error) return `第 ${trial.error.step} 步出错：${trial.error.message}`;
    const status = trial.status === 'not-started' ? '没发起成' : STATUS[trial.status].label;
    return trial.open.length > 0
      ? `${status}，停在 ${trial.open.map((o) => o.nodeName).join('、')}`
      : `${status}${trial.result ? `（${trial.result}）` : ''}`;
  };

  return () => {
    if (files[TEST_FILE] === undefined)
      return (
        <Alert
          tone="info"
          title="还没有场景测试"
          description="test.ts 里用 defineScenarios 写：谁发起、单据填什么、一步步怎么处理、期望停在哪或怎么结束。"
          action={
            <Button size="sm" onClick={onCreate}>
              加 test.ts
            </Button>
          }
        />
      );
    const passed = results?.filter((r) => r.passed).length ?? 0;
    return (
      <Flex direction="column" gap="md">
        <Flex gap="sm" align="center" wrap>
          <Button loading={running} onClick={() => void run()}>
            运行全部场景
          </Button>
          {results && (
            <Badge tone={passed === results.length ? 'success' : 'danger'}>
              {passed} / {results.length} 通过
            </Badge>
          )}
          <Small tone="muted">在另一个内存库里跑，用的是现在的工作副本。</Small>
        </Flex>
        {failed && <Alert tone="danger" title="跑不起来" description={failed} />}
        {results && results.length === 0 && (
          <Small tone="muted">test.ts 里没有场景（defineScenarios 的第二个参数是空的）。</Small>
        )}
        {results && results.length > 0 && (
          <ItemList aria-label="场景">
            {results.map((result) => (
              <ItemListItem
                key={result.name}
                start={
                  <Icon
                    icon={result.passed ? CircleCheck : CircleX}
                    tone={result.passed ? 'success' : 'danger'}
                  />
                }
                title={result.name}
                description={result.passed ? summary(result) : result.problems.join('；')}
              />
            ))}
          </ItemList>
        )}
      </Flex>
    );
  };
});
