/**
 * action（只在服务端导入）：引擎的命令经它们调用，当前用户是做事的人；入参按 zod 校验，要求登录（flow.use）
 */
import { FlowError } from '@zerodep-dev/flow-ts-engine';
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

export const actions = defineActions({
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
      }),
      permission: 'flow.use',
    },
    ({ workItem, outcome, comment }) =>
      run(async () => {
        const result = await engine.run(
          { type: 'complete', workItem, outcome, ...(comment ? { comment } : {}) },
          currentActor(),
        );
        return result.instance.status;
      }),
  ),
  withdraw: defineAction(
    { input: z.object({ instance: z.number().int() }), permission: 'flow.use' },
    ({ instance }) =>
      run(async () => void (await engine.run({ type: 'withdraw', instance }, currentActor()))),
  ),
});
