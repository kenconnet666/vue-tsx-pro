/**
 * 场景测试（流程工程的 test.ts，`defineScenarios`）：编译工程、取出场景，逐个试运行（simulate），对照期望。
 * 工作室的“测试”页签与单元测试都用它；工程里没有 test.ts 时没有场景。
 *
 *   const results = await runScenarios(project, { options: { transform, org, extensions } });
 *   results.filter((r) => !r.passed).map((r) => `${r.name}：${r.problems.join('；')}`);
 */
import type { FlowProject, ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { PROJECT_FILES } from '@zerodep-dev/flow-ts-model';
import type { Scenario, ScenarioExpect, Scenarios } from '../extensions.ts';
import { buildProject } from '../publish/project.ts';
import type { Actor } from '../types.ts';
import { simulate, type SimulationInput, type SimulationResult } from './simulate.ts';

/** 场景测试的文件 */
export const TEST_FILE = PROJECT_FILES.test;

/** 一个场景的结果 */
export interface ScenarioResult {
  readonly name: string;
  readonly passed: boolean;
  /** 哪里和期望不一样（通过时为空） */
  readonly problems: readonly string[];
  readonly run: SimulationResult;
}

/** runScenarios 的选项 */
export interface RunScenariosOptions {
  /** 引擎的选项（编译用的 transform、组织、扩展）；同 simulate */
  readonly options?: SimulationInput['options'];
  /** 先发布的别的流程（被调用的） */
  readonly processes?: readonly (ProcessDefinition | FlowProject)[];
  /** 场景里写的发起人编号换成 Actor（角色、部门）；不给时只有编号 */
  readonly actorOf?: (id: string) => Actor | undefined | Promise<Actor | undefined>;
}

const sorted = (values: readonly string[]) => [...values].sort();
const list = (values: readonly string[]) => (values.length ? values.join('、') : '无');

/** 试运行的结果对照期望：写了的才核对 */
export function scenarioProblems(run: SimulationResult, expect: ScenarioExpect): string[] {
  const problems: string[] = [];
  if (expect.error) {
    if (!run.error) problems.push('期望出错，没有出错');
    else {
      if (expect.error.step !== undefined && run.error.step !== expect.error.step)
        problems.push(`在第 ${run.error.step} 步出错，期望第 ${expect.error.step} 步`);
      if (expect.error.message && !run.error.message.includes(expect.error.message))
        problems.push(`错误是“${run.error.message}”，期望含“${expect.error.message}”`);
    }
  } else if (run.error) {
    problems.push(`第 ${run.error.step} 步出错：${run.error.message}`);
  }
  if (expect.status && run.status !== expect.status)
    problems.push(`状态是 ${run.status}，期望 ${expect.status}`);
  if (expect.result !== undefined && run.result !== expect.result)
    problems.push(`结果是 ${run.result ?? '无'}，期望 ${expect.result}`);
  if (expect.at) {
    const at = sorted(run.open.map((o) => o.node));
    if (at.join() !== sorted(expect.at).join())
      problems.push(`停在 ${list(at)}，期望 ${list(sorted(expect.at))}`);
  }
  if (expect.waitingFor) {
    const waiting = sorted(run.open.flatMap((o) => (o.assignee ? [o.assignee] : [])));
    if (waiting.join() !== sorted(expect.waitingFor).join())
      problems.push(`等 ${list(waiting)} 处理，期望 ${list(sorted(expect.waitingFor))}`);
  }
  return problems;
}

/** 跑工程里 test.ts 的全部场景；编译不过照常抛（invalid-definition，带文件） */
export async function runScenarios(
  project: FlowProject,
  { options, processes, actorOf }: RunScenariosOptions = {},
): Promise<ScenarioResult[]> {
  if (project.files[TEST_FILE] === undefined) return [];
  const { linked } = await buildProject(project, options?.transform, options?.modules);
  const scenarios = (linked.module(TEST_FILE)['default'] ?? {}) as Scenarios;
  const results: ScenarioResult[] = [];
  for (const [name, scenario] of Object.entries(scenarios) as [string, Scenario][]) {
    const initiator = scenario.initiator
      ? ((await actorOf?.(scenario.initiator)) ?? { id: scenario.initiator })
      : undefined;
    const run = await simulate(project, {
      ...(scenario.variables ? { variables: scenario.variables } : {}),
      ...(initiator ? { initiator } : {}),
      ...(scenario.steps ? { steps: scenario.steps } : {}),
      ...(options ? { options } : {}),
      ...(processes ? { processes } : {}),
    });
    const problems = scenarioProblems(run, scenario.expect);
    results.push({ name, passed: problems.length === 0, problems, run });
  }
  return results;
}
