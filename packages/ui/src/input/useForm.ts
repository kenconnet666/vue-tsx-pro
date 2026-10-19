/**
 * 表单控制器：值、校验、错误、提交状态放在一个对象里，交给 <Form controller>（COMPONENTS.md §1 的“命令式能力”）。
 * 校验用 zod（使用方安装的 peer 依赖，zod 与 zod/mini 都可以），也可以写 validate 函数。
 * 参考 TanStack Form、React Hook Form 的做法，取其中最常用的部分。
 *
 *   const form = useForm({
 *     schema: z.object({ email: z.email('邮箱格式不对'), age: z.coerce.number().int().min(18, '未满 18 岁') }),
 *     initial: { email: '', age: '' },          // 类型是 schema 的输入（z.input）
 *     onSubmit: (values) => api.signup(values), // 拿到解析后的输出（z.output）：age 已是数字
 *   });
 *   <Form controller={form}>
 *     <form.Field name="email" label="邮箱"><TextField value={_bind(form.values.email)} /></form.Field>
 *     <Button type="submit" loading={form.submitting}>登录</Button>
 *   </Form>
 *
 * 何时显示错误（“迟一点批评、早一点肯定”）：字段失焦后才显示它的错误；提交过一次之后，所有字段随输入实时更新。
 * 字段的值经 v-model 写回，中文输入法组合输入期间不写回，所以组合中途不会触发校验。
 *
 * schema 还决定字段的约束（form-constraints.ts）：标签的必填标记、输入框的 maxlength、NumberField 的 min / max
 * 都从 schema 来，不用在控件上再写一遍。
 */
import type { TsxComponent } from '@vue-tsx-pro/tsx';
import { reactive, shallowReactive, watch } from 'vue';
import { safeParseAsync, type $ZodIssue, type $ZodType } from 'zod/v4/core';
import { Field, type FieldProps } from './Field';
import { createConstraints, type FieldConstraints } from './form-constraints';

/** 字段路径 → 错误信息；路径用点连接（`address.city`、`items.0.name`） */
export type FormErrors = Partial<Record<string, string>>;

/** 当作一个整体的值：不再往里展开路径 */
type FieldLeaf = string | number | boolean | bigint | symbol | null | undefined | Date | Blob;

/**
 * 值里的字段路径：点连接，数组下标是数字（`email`、`address.city`、`items.0.name`）。
 * 最多展开 6 层，再深的结构写成 string 也照样能用（Field 的 name、setError 都接受）
 */
export type FieldPath<Values, Depth extends unknown[] = []> = Depth['length'] extends 6
  ? never
  : Values extends readonly (infer Item)[]
    ? `${number}` | `${number}.${FieldPath<Item, [...Depth, unknown]>}`
    : Values extends object
      ? {
          [K in keyof Values & string]:
            | K
            | (NonNullable<Values[K]> extends FieldLeaf
                ? never
                : `${K}.${FieldPath<NonNullable<Values[K]>, [...Depth, unknown]>}`);
        }[keyof Values & string]
      : never;

/** useForm 的选项；Values 是表单里的值（有 schema 时是它的输入类型），Output 是校验通过后交给 onSubmit 的值 */
export interface FormOptions<Values extends object, Output = Values> {
  /** 初始值；reset() 回到它 */
  initial: Values;
  /** zod schema：整份值一起校验，issue 的 path 决定错误挂在哪个字段上；字段约束也从它推出 */
  schema?: $ZodType<Output, Values>;
  /** 自定义校验：返回各字段的错误（可以是 Promise），与 schema 的结果合并 */
  validate?: (values: Values) => FormErrors | Promise<FormErrors>;
  /** 什么时候开始校验：blur（默认，失焦后）、change（输入时）、submit（只在提交时）；提交过一次之后总是随输入更新 */
  validateOn?: 'blur' | 'change' | 'submit';
  /** 校验通过后调用，拿到 schema 解析后的值（转换、默认值、coerce 都已生效）；返回 Promise 时 submitting 一直为 true 直到完成 */
  onSubmit?: (values: Output) => unknown;
}

/** 控制器里与值的类型无关的部分：Form、Field 只用到它，任何 FormController 都能交给 <Form controller> */
export interface FormControllerBase {
  /** 所有字段当前的校验错误（含还没显示的） */
  readonly errors: Readonly<FormErrors>;
  /** 正在执行 onSubmit */
  readonly submitting: boolean;
  /** 提交过几次（不论成功与否） */
  readonly submitCount: number;
  /** 字段的错误是否该显示：失焦过、或提交过之后才显示；Field 用它 */
  visibleError(path: string): string | undefined;
  /** 字段失焦：Field 在焦点离开字段时调用 */
  blur(path: string): void;
  /** 校验整份表单，返回是否通过 */
  validate(): Promise<boolean>;
  /** 提交：先校验，通过后调用 onSubmit；返回是否通过校验 */
  submit(): Promise<boolean>;
  /** 回到初始值，清空错误与失焦记录 */
  reset(): void;
  /** 字段从 schema 推出的约束（必填、长度、范围…）；Field 交给控件，控件上显式写的优先 */
  constraints(path: string): FieldConstraints;
}

/** 表单控制器：useForm 的返回值 */
export interface FormController<Values extends object> extends FormControllerBase {
  /** 当前值（响应式）：控件写 value={_bind(form.values.email)} */
  readonly values: Values;
  /** 回到初始值（或给定的值），清空错误与失焦记录 */
  reset(values?: Values): void;
  /** 设置某个字段的错误（如服务端返回的“邮箱已注册”），undefined 清除；下次校验时被覆盖 */
  setError(path: FieldPath<Values>, message: string | undefined): void;
  /**
   * 就是 Field 组件，只是 name 的类型收窄为这份值的字段路径，写错字段名时类型检查报错：
   * `<form.Field name="email" label="邮箱">…</form.Field>`（参考 TanStack Form 的 form.Field）
   */
  readonly Field: TsxComponent<Omit<FieldProps, 'name'> & { name?: FieldPath<Values> }>;
}

/** zod issue 的路径 → 点连接的字符串 */
const issuePath = (issue: $ZodIssue) => issue.path.map(String).join('.');

/**
 * 创建表单控制器（组件 setup 里或模块顶层都可以）。
 * 有 schema 时值的类型取自 schema（initial 要符合它的输入类型），onSubmit 拿到解析后的输出
 */
export function useForm<Values extends object, Output = Values>(
  options: FormOptions<Values, Output>,
): FormController<Values> {
  const { schema, validateOn = 'blur', onSubmit } = options;
  const values = reactive(structuredClone(options.initial)) as Values;
  const state = shallowReactive({
    errors: {} as FormErrors,
    touched: new Set<string>(),
    submitting: false,
    submitCount: 0,
  });
  // 异步校验可能乱序返回：只采用最后一次的结果
  let run = 0;
  // 最近一次通过校验时 schema 解析出的值，交给 onSubmit
  let parsed: Output | undefined;
  const constraints = createConstraints(schema);

  async function collect(): Promise<{ errors: FormErrors; output: Output }> {
    const errors: FormErrors = {};
    let output = values as unknown as Output;
    if (schema) {
      const result = await safeParseAsync(schema, values);
      if (result.success) output = result.data;
      for (const issue of result.error?.issues ?? []) {
        errors[issuePath(issue)] ??= issue.message;
      }
    }
    if (options.validate) {
      for (const [path, message] of Object.entries(await options.validate(values))) {
        if (message) errors[path] ??= message;
      }
    }
    return { errors, output };
  }

  const controller: FormController<Values> = {
    values,
    get errors() {
      return state.errors;
    },
    get submitting() {
      return state.submitting;
    },
    get submitCount() {
      return state.submitCount;
    },
    visibleError(path) {
      if (state.submitCount === 0 && !state.touched.has(path)) return undefined;
      return state.errors[path];
    },
    blur(path) {
      if (state.touched.has(path)) return;
      state.touched = new Set(state.touched).add(path);
      if (validateOn !== 'submit') void controller.validate();
    },
    async validate() {
      const current = ++run;
      const { errors, output } = await collect();
      if (current !== run) return Object.keys(errors).length === 0;
      state.errors = errors;
      parsed = output;
      return Object.keys(errors).length === 0;
    },
    async submit() {
      state.submitCount++;
      const valid = await controller.validate();
      if (!valid || !onSubmit) return valid;
      state.submitting = true;
      try {
        await onSubmit(parsed as Output);
      } finally {
        state.submitting = false;
      }
      return true;
    },
    reset(next = options.initial) {
      run++;
      Object.assign(values, structuredClone(next));
      state.errors = {};
      state.touched = new Set();
      state.submitCount = 0;
    },
    setError(path, message) {
      state.errors = { ...state.errors, [path]: message };
    },
    constraints,
    Field,
  };

  // 输入时：change 模式一开始就校验；其他模式在提交过之后才随输入更新
  watch(
    () => values,
    () => {
      if (validateOn === 'change' || state.submitCount > 0) void controller.validate();
    },
    { deep: true },
  );

  return controller;
}
