/**
 * action（只在服务端导入）：引擎的命令经它们调用，当前用户是做事的人；入参按 zod 校验，要求登录（flow.use）
 */
import { FlowError } from '@zerodep-dev/flow-ts-engine';
import { simulate } from '@zerodep-dev/flow-ts-engine/testing';
import type { ProcessDefinition } from '@zerodep-dev/flow-ts-model';
import { z } from 'zod';
import { ActionError, defineAction, defineActions } from '@zerodep-dev/vue-tsx-pro-kit';
import { currentActor } from './server/context.ts';
import { engine } from './server/flow.ts';

/** 引擎的错误换成带 HTTP 状态的 ActionError：页面直接显示原因 */
async function run<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (!(error instanceof FlowError)) throw error;
    const status = error.code === 'not-found' ? 404 : error.code === 'forbidden' ? 403 : 400;
    throw new ActionError(error.message, status, [{ message: error.message }]);
  }
}

/** 定义从设计器来：结构由发布时的校验把关，这里只要求是个对象 */
const definitionInput = z.custom<ProcessDefinition>(
  (value) => typeof value === 'object' && value !== null && 'key' in value && 'nodes' in value,
  '要是流程定义',
);

export const actions = defineActions({
  simulate: defineAction(
    { input: z.object({ definition: definitionInput }), permission: 'flow.admin' },
    async ({ definition }) => {
      const run = await simulate(definition, {
        options: { org: { members: () => [] } },
      });
      return {
        status: run.status,
        result: run.result,
        open: run.open.map((o) => ({
          nodeName: o.nodeName,
          assignee: o.assignee,
          candidates: [...o.candidates],
        })),
        ...(run.error ? { error: run.error } : {}),
      };
    },
  ),
  publish: defineAction(
    { input: z.object({ definition: definitionInput }), permission: 'flow.admin' },
    ({ definition }) => run(() => engine.publish(definition, currentActor())),
  ),
  start: defineAction(
    {
      input: z.object({ process: z.string(), variables: z.record(z.string(), z.unknown()) }),
      permission: 'flow.use',
    },
    ({ process, variables }) =>
      run(
        async () =>
          (await engine.run({ type: 'start', process, variables }, currentActor())).instance.id,
      ),
  ),
  claim: defineAction(
    { input: z.object({ workItem: z.number().int() }), permission: 'flow.use' },
    ({ workItem }) =>
      run(async () => void (await engine.run({ type: 'claim', workItem }, currentActor()))),
  ),
  complete: defineAction(
    {
      input: z.object({
        workItem: z.number().int(),
        outcome: z.string(),
        comment: z.string().optional(),
        // 退回到运行时选的节点（结果的 target 是 choose）
        returnTo: z.string().optional(),
      }),
      permission: 'flow.use',
    },
    ({ workItem, outcome, comment, returnTo }) =>
      run(async () => {
        const result = await engine.run(
          {
            type: 'complete',
            workItem,
            outcome,
            ...(comment ? { comment } : {}),
            ...(returnTo ? { returnTo } : {}),
          },
          currentActor(),
        );
        return result.instance.status;
      }),
  ),
  comment: defineAction(
    {
      input: z.object({ instance: z.number().int(), text: z.string().trim().min(1) }),
      permission: 'flow.use',
    },
    ({ instance, text }) =>
      run(async () => void (await engine.run({ type: 'comment', instance, text }, currentActor()))),
  ),
  transfer: defineAction(
    {
      input: z.object({
        workItem: z.number().int(),
        to: z.string().min(1),
        comment: z.string().optional(),
      }),
      permission: 'flow.use',
    },
    ({ workItem, to, comment }) =>
      run(
        async () =>
          void (await engine.run(
            { type: 'transfer', workItem, to, ...(comment ? { comment } : {}) },
            currentActor(),
          )),
      ),
  ),
  remind: defineAction(
    {
      input: z.object({ instance: z.number().int(), message: z.string().optional() }),
      permission: 'flow.use',
    },
    ({ instance, message }) =>
      run(
        async () =>
          void (await engine.run(
            { type: 'remind', instance, ...(message ? { message } : {}) },
            currentActor(),
          )),
      ),
  ),
  cc: defineAction(
    {
      input: z.object({
        instance: z.number().int(),
        users: z.array(z.string()).min(1),
        message: z.string().optional(),
      }),
      permission: 'flow.use',
    },
    ({ instance, users, message }) =>
      run(
        async () =>
          void (await engine.run(
            { type: 'cc', instance, users, ...(message ? { message } : {}) },
            currentActor(),
          )),
      ),
  ),
  withdraw: defineAction(
    { input: z.object({ instance: z.number().int() }), permission: 'flow.use' },
    ({ instance }) =>
      run(async () => void (await engine.run({ type: 'withdraw', instance }, currentActor()))),
  ),
});
