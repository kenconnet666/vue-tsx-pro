/**
 * action（ROADMAP 13.5）：服务端的写操作，入参先按 schema 校验（zod 4 等实现了 Standard Schema 的都行），可以要求权限；
 * 浏览器拿到带类型的调用函数，经 POST /_action/<名字> 调用，值经 json-wire 往返（bigint、Decimal、日期原样）。
 *
 *   // src/actions.ts（只在服务端）
 *   export const actions = defineActions({
 *     addTodo: defineAction({ input: z.object({ title: z.string().min(1) }), permission: 'todo.write' },
 *       async ({ title }) => useContext().db.insert(Todo).values({ title }).returnId()),
 *   });
 *   // src/client.ts
 *   export const actions = actionClient<typeof actions>();
 *   // 组件里
 *   await actions.addTodo({ title });   // 校验不过抛 ActionError，issues 里是每一处问题
 */
import { fromWire, toWire } from '@zerodep-dev/vue-tsx-pro-ui';

/** Standard Schema（https://standardschema.dev）里 action 用到的部分 */
export interface InputSchema<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly validate: (
      value: unknown,
    ) => ValidationResult<Output> | Promise<ValidationResult<Output>>;
    readonly types?: { readonly input: Input; readonly output: Output } | undefined;
  };
}

type ValidationResult<Output> =
  | { readonly value: Output; readonly issues?: undefined }
  | { readonly issues: readonly ActionIssue[] };

/** 入参的一处问题：哪个字段、什么问题 */
export interface ActionIssue {
  readonly message: string;
  readonly path?: readonly (PropertyKey | { readonly key: PropertyKey })[] | undefined;
}

/** 一个 action：入参的 schema、要求的权限、处理函数 */
export interface Action<Input = unknown, Output = unknown, Result = unknown> {
  readonly input: InputSchema<Input, Output>;
  readonly permission?: string;
  // 写成方法：参数按双向检查，各种 action 才能放进同一个 Actions 表
  handler(input: Output): Result;
}

/** 名字 → action（只在服务端导入） */
export type Actions = Record<string, Action<unknown, unknown, unknown>>;

/** 定义一个 action：处理函数拿到校验后的入参 */
export const defineAction = <Input, Output, Result>(
  options: { input: InputSchema<Input, Output>; permission?: string },
  handler: (input: Output) => Result,
): Action<Input, Output, Result> => ({ ...options, handler });

/** 声明应用的 action（只为类型推导，原样返回） */
export const defineActions = <const T extends Actions>(actions: T): T => actions;

/** 调用 action 的地址前缀 */
export const ACTION_PATH = '/_action/';

/** action 失败：status 是服务端的 HTTP 状态（400 入参不对、403 没有权限、404 没有这个 action、500 处理出错） */
export class ActionError extends Error {
  readonly status: number;
  readonly issues: readonly ActionIssue[];

  constructor(message: string, status: number, issues: readonly ActionIssue[] = []) {
    super(message);
    this.name = 'ActionError';
    this.status = status;
    this.issues = issues;
  }
}

/**
 * 服务端：执行一个 action。can 判断权限，出错时抛 ActionError（调用方转成响应）
 */
export async function runAction(
  actions: Actions,
  name: string,
  body: unknown,
  can: (permission: string | undefined) => boolean,
): Promise<unknown> {
  const action = Object.hasOwn(actions, name) ? actions[name] : undefined;
  if (!action) throw new ActionError(`没有 action ${name}`, 404);
  if (!can(action.permission)) throw new ActionError(`没有权限：${action.permission}`, 403);
  const result = await action.input['~standard'].validate(fromWire(body));
  if (result.issues) throw new ActionError('入参不对', 400, result.issues);
  return toWire(await action.handler(result.value));
}

/** 浏览器：按 action 的类型生成调用函数，actions.名字(入参) 返回处理函数的结果 */
export function actionClient<A extends Actions>(): {
  [K in keyof A]: A[K] extends Action<infer Input, unknown, infer Result>
    ? (input: Input) => Promise<Awaited<Result>>
    : never;
} {
  return new Proxy({} as never, {
    get: (_target, name) => async (input: unknown) => {
      const response = await fetch(ACTION_PATH + String(name), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(toWire(input) ?? null),
      });
      const json: unknown = await response.json();
      if (!response.ok) {
        const { message, issues } = json as { message: string; issues?: ActionIssue[] };
        throw new ActionError(message, response.status, issues);
      }
      return fromWire(json);
    },
  });
}
