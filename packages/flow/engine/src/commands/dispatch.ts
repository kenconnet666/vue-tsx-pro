/**
 * 命令入口：run 经拦截器后按命令类型分发；runMany 一条一个事务地批量执行。
 */
import { FlowError } from '../core/errors.ts';
import type { Actor, BatchResult, FlowCommand, RunResult } from '../types.ts';
import type { EngineCore } from '../core/context.ts';

/** 命令入口：装进引擎核心（core.commands），别的模块经它调用 */
export function createCommands(core: EngineCore) {
  const { options, withInstance } = core;

  /** 拦截之后执行命令 */
  async function run(input: FlowCommand, actor: Actor): Promise<RunResult> {
    const command = (await options.intercept?.before?.(input, actor)) ?? input;
    return dispatch(command, actor);
  }

  async function dispatch(command: FlowCommand, actor: Actor): Promise<RunResult> {
    switch (command.type) {
      case 'start':
        return core.starts.start(command, actor);
      case 'operate':
        return core.ops.operate(command, actor);
      case 'claim':
        return core.ops.operate(
          { type: 'operate', workItem: command.workItem, operation: 'claim' },
          actor,
          command,
        );
      case 'complete':
        return core.tasks.complete(command, actor);
      case 'transfer':
      case 'reassign':
        return core.ops.operate(
          {
            type: 'operate',
            workItem: command.workItem,
            operation: command.type,
            input: { to: command.to, comment: command.comment },
          },
          actor,
          command,
        );
      case 'withdraw':
        return core.admin.withdraw(command, actor);
      case 'terminate':
        return core.admin.terminate(command, actor);
      case 'suspend':
      case 'resume':
        return core.admin.suspendOrResume(command, actor);
      case 'skipJob':
        return core.jobs.skipJob(command, actor);
      case 'jump':
        return core.admin.jump(command, actor);
      case 'remind':
        return core.admin.remind(command, actor);
      case 'changeData':
        return core.admin.changeData(command, actor);
      case 'migrate':
        return core.admin.migrate(command, actor);
      case 'comment':
        return withInstance(
          command.instance,
          actor,
          async (exec) => {
            exec.addEvent('instance.commented', { comment: command.text });
          },
          command,
        );
      case 'cc':
        if (command.users.length === 0) {
          throw new FlowError('invalid-input', '抄送要选人', { field: 'users', code: 'required' });
        }
        return withInstance(
          command.instance,
          actor,
          async (exec) => {
            await exec.sendCc(
              null,
              command.users.map((user) => ({ user: user as `${bigint}` })),
              command.message,
            );
          },
          command,
        );
    }
  }

  async function runMany(commands: readonly FlowCommand[], actor: Actor): Promise<BatchResult[]> {
    const results: BatchResult[] = [];
    for (const command of commands) {
      try {
        results.push({ ok: true, result: await run(command, actor) });
      } catch (error) {
        if (!(error instanceof FlowError)) throw error;
        results.push({ ok: false, code: error.code, message: error.message });
      }
    }
    return results;
  }

  return { run, dispatch, runMany };
}

/** createCommands 给出的函数 */
export type Commands = ReturnType<typeof createCommands>;
