/**
 * 表单控制器：值、校验、错误、提交状态放在一个对象里，交给 <Form controller>（COMPONENTS.md §1 的“命令式能力”）。
 * 校验只依赖 Standard Schema 接口（@standard-schema/spec），zod、valibot、arktype 的 schema 直接可用；
 * 也可以写 validate 函数。参考 TanStack Form、React Hook Form 的做法，取其中最常用的部分。
 *
 *   const form = useForm({
 *     initial: { email: '', password: '' },
 *     schema: z.object({ email: z.email('邮箱格式不对'), password: z.string().min(8, '至少 8 位') }),
 *     onSubmit: (values) => api.login(values),
 *   });
 *   <Form controller={form}>
 *     <form.Field name="email" label="邮箱"><TextField value={_bind(form.values.email)} /></form.Field>
 *     <Button type="submit" loading={form.submitting}>登录</Button>
 *   </Form>
 *
 * 何时显示错误（“迟一点批评、早一点肯定”）：字段失焦后才显示它的错误；提交过一次之后，所有字段随输入实时更新。
 * 字段的值经 v-model 写回，中文输入法组合输入期间不写回，所以组合中途不会触发校验。
 */
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { TsxComponent } from '@vue-tsx-pro/tsx';
import { reactive, shallowReactive, watch } from 'vue';
import { Field, type FieldProps } from './Field';

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

/** useForm 的选项 */
export interface FormOptions<Values extends object> {
  /** 初始值；reset() 回到它 */
  initial: Values;
  /** Standard Schema（zod、valibot 等）：整份值一起校验，issue 的 path 决定错误挂在哪个字段上 */
  schema?: StandardSchemaV1<Values>;
  /** 自定义校验：返回各字段的错误（可以是 Promise），与 schema 的结果合并 */
  validate?: (values: Values) => FormErrors | Promise<FormErrors>;
  /** 什么时候开始校验：blur（默认，失焦后）、change（输入时）、submit（只在提交时）；提交过一次之后总是随输入更新 */
  validateOn?: 'blur' | 'change' | 'submit';
  /** 校验通过后调用；返回 Promise 时 submitting 一直为 true 直到完成 */
  onSubmit?: (values: Values) => unknown;
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

/** Standard Schema 的 issue 路径 → 点连接的字符串 */
function issuePath(issue: StandardSchemaV1.Issue): string {
  return (issue.path ?? [])
    .map((segment) => String(typeof segment === 'object' ? segment.key : segment))
    .join('.');
}

/** 创建表单控制器（组件 setup 里或模块顶层都可以） */
export function useForm<Values extends object>(
  options: FormOptions<Values>,
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

  async function collect(): Promise<FormErrors> {
    const errors: FormErrors = {};
    if (schema) {
      const result = await schema['~standard'].validate(values);
      for (const issue of result.issues ?? []) {
        const path = issuePath(issue);
        errors[path] ??= issue.message;
      }
    }
    if (options.validate) {
      for (const [path, message] of Object.entries(await options.validate(values))) {
        if (message) errors[path] ??= message;
      }
    }
    return errors;
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
      const errors = await collect();
      if (current === run) state.errors = errors;
      return Object.keys(errors).length === 0;
    },
    async submit() {
      state.submitCount++;
      const valid = await controller.validate();
      if (!valid || !onSubmit) return valid;
      state.submitting = true;
      try {
        await onSubmit(values);
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
