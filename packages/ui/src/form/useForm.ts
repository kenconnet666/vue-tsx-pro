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
 *
 * - 数组字段：`form.array('items')` 增删、插入、移动，给每项一个稳定的 key；错误与失焦记录跟着下标移动。
 * - 单字段异步校验：`fields: { username: { validate: (name, values, signal) => api.taken(name, { signal }) } }`，
 *   这个字段变化时防抖运行、只采用最后一次的结果，提交时等它完成；`form.validating('username')` 显示校验中。
 * - 改动：`form.dirty` 是值与初始值（或上次 reset 的值）不同；未保存离开的提醒用 useLeaveConfirmation(() => form.dirty)。
 */
import type { TsxComponent } from '@vue-tsx-pro/tsx';
import { computed, reactive, shallowReactive, toRaw, watch } from 'vue';
import { safeParseAsync, type $ZodIssue, type $ZodType } from 'zod/v4/core';
import { Field, type FieldProps } from './Field';
import { createConstraints, type FieldConstraints } from './form-constraints';
import { isNumeric, sameNumeric } from '../utils/data/numeric';

/** 自带 compare 的值（@internationalized/date 的日期值）：不在运行时导入，按形状识别 */
const isComparable = (value: unknown): value is { compare: (other: unknown) => number } =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { compare?: unknown }).compare === 'function';

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

/** 字段路径 P 处的值的类型（`PathValue<Values, 'items.0.name'>` → string） */
export type PathValue<Values, P extends string> = P extends `${infer Key}.${infer Rest}`
  ? Values extends readonly (infer Item)[]
    ? PathValue<NonNullable<Item>, Rest>
    : Key extends keyof Values
      ? PathValue<NonNullable<Values[Key]>, Rest>
      : never
  : Values extends readonly (infer Item)[]
    ? Item
    : P extends keyof Values
      ? Values[P]
      : never;

/** 值是数组的字段路径：form.array 只接受这些 */
export type ArrayPath<Values> = {
  [P in FieldPath<Values>]: NonNullable<PathValue<Values, P>> extends readonly unknown[]
    ? P
    : never;
}[FieldPath<Values>];

/** 单个字段的校验：只在这个字段变化时运行（防抖），适合要请求接口的“用户名已占用” */
export interface FieldValidator<Value, Values> {
  /** 返回错误信息，通过时返回 undefined；signal 在值又变了、表单重置时中止 */
  validate: (
    value: Value,
    values: Values,
    signal: AbortSignal,
  ) => string | undefined | Promise<string | undefined>;
  /** 值停止变化多久（毫秒）后运行，默认 300 */
  debounce?: number;
}

/** 数组字段的操作：form.array(path) 的返回值 */
export interface FieldArray<Item> {
  /** 当前的各项（就是 values 里的数组） */
  readonly items: readonly Item[];
  /** 每项一个稳定的 key：渲染列表时用，增删、移动后不变 */
  readonly keys: readonly string[];
  /** 加到末尾 */
  append(item: Item): void;
  /** 插到 index 处 */
  insert(index: number, item: Item): void;
  /** 删掉 index 处的一项 */
  remove(index: number): void;
  /** 把 from 处的一项移到 to 处 */
  move(from: number, to: number): void;
}

/** useForm 的选项；Values 是表单里的值（有 schema 时是它的输入类型），Output 是校验通过后交给 onSubmit 的值 */
export interface FormOptions<Values extends object, Output = Values> {
  /** 初始值；reset() 回到它 */
  initial: Values;
  /** zod schema：整份值一起校验，issue 的 path 决定错误挂在哪个字段上；字段约束也从它推出 */
  schema?: $ZodType<Output, Values>;
  /** 自定义校验：返回各字段的错误（可以是 Promise），与 schema 的结果合并 */
  validate?: (values: Values) => FormErrors | Promise<FormErrors>;
  /**
   * 单字段异步校验：按字段路径给出，这个字段变化时防抖运行，结果与 schema 的合并（schema 的错误优先）。
   * NoInfer：Values 只从 initial 与 schema 推出，validate 的参数类型才能跟着推出来
   */
  fields?: NoInfer<{ [P in FieldPath<Values>]?: FieldValidator<PathValue<Values, P>, Values> }>;
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
  /** 值与初始值（或上次 reset 的值）不同 */
  readonly dirty: boolean;
  /** 字段（不写时为任一字段）的单字段校验正在进行 */
  validating(path?: string): boolean;
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
  /** 回到初始值（或给定的值，之后 dirty 以它为准），清空错误与失焦记录；保存成功后写 reset(form.values) */
  reset(values?: Values): void;
  /** 字段与初始值不同 */
  isDirty(path: FieldPath<Values>): boolean;
  /** 数组字段的增删、插入、移动 */
  array<P extends ArrayPath<Values>>(
    path: P,
  ): FieldArray<NonNullable<PathValue<Values, P>> extends readonly (infer Item)[] ? Item : never>;
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

/** 按点连接的路径取值；中途是 null / undefined 时为 undefined */
function readPath(source: unknown, path: string): unknown {
  let current = source;
  for (const key of path.split('.')) {
    if (current == null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * 结构相等：普通对象与数组逐项比较；Date 比时间；数值（number、bigint、Decimal）按大小，Decimal('1.0') 与 1 相等；
 * 日期值（CalendarDate 等）按它自己的 compare；其余（含 Blob）比引用
 */
function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (isNumeric(a) && isNumeric(b)) return sameNumeric(a, b);
  if (isComparable(a) && isComparable(b) && a.constructor === b.constructor)
    return a.compare(b) === 0;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b) || a instanceof Blob || b instanceof Blob) return false;
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) =>
    sameValue((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
  );
}

/**
 * 数组字段的下标变了：`prefix.旧下标…` 的键改成 `prefix.新下标…`，map 返回 undefined 的（删掉的项）丢弃
 */
function shiftIndices(key: string, prefix: string, map: (index: number) => number | undefined) {
  if (!key.startsWith(`${prefix}.`)) return key;
  const rest = key.slice(prefix.length + 1);
  const [head, ...tail] = rest.split('.');
  const index = Number(head);
  if (!Number.isInteger(index)) return key;
  const next = map(index);
  return next === undefined ? undefined : [prefix, next, ...tail].join('.');
}

let nextArrayKey = 0;

/** 一个字段的单字段校验的进行状态 */
interface FieldRun {
  /** 防抖的定时器 */
  timer?: ReturnType<typeof setTimeout>;
  /** 正在校验的那次 */
  running?: { value: unknown; controller: AbortController; done: Promise<void> };
  /** 上次校验完成时的值 */
  checked?: unknown;
}

/**
 * 创建表单控制器（组件 setup 里或模块顶层都可以）。
 * 有 schema 时值的类型取自 schema（initial 要符合它的输入类型），onSubmit 拿到解析后的输出
 */
export function useForm<Values extends object, Output = Values>(
  options: FormOptions<Values, Output>,
): FormController<Values> {
  const { schema, validateOn = 'blur', onSubmit } = options;
  const fieldValidators = Object.entries(options.fields ?? {}) as [
    string,
    FieldValidator<unknown, Values>,
  ][];
  const values = reactive(structuredClone(options.initial)) as Values;
  const state = shallowReactive({
    errors: {} as FormErrors,
    // 单字段校验的结果，与 errors 分开存：整份校验不会冲掉还在路上的单字段结果
    fieldErrors: {} as FormErrors,
    touched: new Set<string>(),
    pending: new Set<string>(),
    submitting: false,
    submitCount: 0,
    // dirty 的比较基准：初始值，或上次 reset 的值
    baseline: structuredClone(options.initial),
  });
  // 异步校验可能乱序返回：只采用最后一次的结果
  let run = 0;
  // 最近一次通过校验时 schema 解析出的值，交给 onSubmit
  let parsed: Output | undefined;
  const constraints = createConstraints(schema);
  const dirty = computed(() => !sameValue(values, state.baseline));
  // 数组字段每项的 key，与数组等长；数组被外部整个换掉（长度不同）时重新生成
  const arrayKeys = new Map<string, string[]>();

  /** 单字段校验的进行状态：每个字段一份 */
  const fieldRuns = new Map<string, FieldRun>();

  function setPending(path: string, pending: boolean) {
    if (state.pending.has(path) === pending) return;
    const next = new Set(state.pending);
    if (pending) next.add(path);
    else next.delete(path);
    state.pending = next;
  }

  /**
   * 运行一个字段的校验。同一个值正在校验时等它；上次校验的就是这个值时直接用上次的结果；
   * 值变了就中止还在路上的那次（只采用最后一次的结果）
   */
  function runField(path: string, validator: FieldValidator<unknown, Values>): Promise<void> {
    const entry = fieldRuns.get(path) ?? {};
    fieldRuns.set(path, entry);
    clearTimeout(entry.timer);
    const value = structuredClone(toRaw(readPath(values, path)));
    if (entry.running && sameValue(entry.running.value, value)) return entry.running.done;
    if (!entry.running && 'checked' in entry && sameValue(entry.checked, value)) {
      return Promise.resolve();
    }
    entry.running?.controller.abort();
    const controller = new AbortController();
    setPending(path, true);
    const done = (async () => {
      try {
        const message = await validator.validate(value, values, controller.signal);
        if (controller.signal.aborted) return;
        entry.checked = value;
        state.fieldErrors = { ...state.fieldErrors, [path]: message };
      } finally {
        if (entry.running?.controller === controller) {
          entry.running = undefined;
          setPending(path, false);
        }
      }
    })();
    entry.running = { value, controller, done };
    return done;
  }

  function cancelFieldRuns() {
    for (const entry of fieldRuns.values()) {
      clearTimeout(entry.timer);
      entry.running?.controller.abort();
    }
    fieldRuns.clear();
    state.pending = new Set();
    state.fieldErrors = {};
  }

  /** 校验整份值：schema 与 validate 的错误（errors）；单字段校验一起跑完，结果在 state.fieldErrors */
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
    // 单字段校验：不等防抖，立刻跑完（值没变的直接用上次结果）
    await Promise.all(fieldValidators.map(([path, validator]) => runField(path, validator)));
    return { errors, output };
  }

  const hasFieldErrors = () => Object.values(state.fieldErrors).some(Boolean);

  /** schema 与 validate 的错误优先，再补上单字段校验的 */
  function mergedErrors(): FormErrors {
    const merged = { ...state.errors };
    for (const [path, message] of Object.entries(state.fieldErrors)) {
      if (message) merged[path] ??= message;
    }
    return merged;
  }

  /** 数组字段的下标变了：错误、失焦记录、单字段校验的结果跟着移 */
  function remapIndices(prefix: string, map: (index: number) => number | undefined) {
    const remap = (errors: FormErrors) =>
      Object.fromEntries(
        Object.entries(errors).flatMap(([key, message]) => {
          const next = shiftIndices(key, prefix, map);
          return next === undefined ? [] : [[next, message]];
        }),
      ) as FormErrors;
    state.errors = remap(state.errors);
    state.fieldErrors = remap(state.fieldErrors);
    state.touched = new Set(
      [...state.touched].flatMap((key) => shiftIndices(key, prefix, map) ?? []),
    );
  }

  function fieldArray(path: string): FieldArray<unknown> {
    const list = () => (readPath(values, path) as unknown[] | undefined) ?? [];
    const keys = () => {
      let current = arrayKeys.get(path);
      if (current?.length !== list().length) {
        current = list().map(() => `item-${++nextArrayKey}`);
        arrayKeys.set(path, current);
      }
      return current;
    };
    /** 改数组与 key：splice 的参数同时作用在两者上 */
    const splice = (start: number, deleteCount: number, ...items: unknown[]) => {
      keys().splice(start, deleteCount, ...items.map(() => `item-${++nextArrayKey}`));
      list().splice(start, deleteCount, ...items);
    };
    return {
      get items() {
        return list();
      },
      get keys() {
        return keys();
      },
      append: (item) => splice(list().length, 0, item),
      insert(index, item) {
        remapIndices(path, (old) => (old >= index ? old + 1 : old));
        splice(index, 0, item);
      },
      remove(index) {
        remapIndices(path, (old) => (old === index ? undefined : old > index ? old - 1 : old));
        splice(index, 1);
      },
      move(from, to) {
        if (from === to) return;
        remapIndices(path, (old) => {
          if (old === from) return to;
          if (from < to && old > from && old <= to) return old - 1;
          if (from > to && old >= to && old < from) return old + 1;
          return old;
        });
        const [key] = keys().splice(from, 1);
        const [item] = list().splice(from, 1);
        keys().splice(to, 0, key!);
        list().splice(to, 0, item);
      },
    };
  }

  const controller: FormController<Values> = {
    values,
    get errors() {
      return mergedErrors();
    },
    get submitting() {
      return state.submitting;
    },
    get submitCount() {
      return state.submitCount;
    },
    get dirty() {
      return dirty.value;
    },
    validating(path) {
      return path === undefined ? state.pending.size > 0 : state.pending.has(path);
    },
    visibleError(path) {
      if (state.submitCount === 0 && !state.touched.has(path)) return undefined;
      return state.errors[path] ?? state.fieldErrors[path];
    },
    blur(path) {
      if (state.touched.has(path)) return;
      state.touched = new Set(state.touched).add(path);
      if (validateOn !== 'submit') void controller.validate();
    },
    async validate() {
      const current = ++run;
      const { errors, output } = await collect();
      const valid = Object.keys(errors).length === 0 && !hasFieldErrors();
      if (current !== run) return valid;
      state.errors = errors;
      parsed = output;
      return valid;
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
      const snapshot = structuredClone(toRaw(next));
      cancelFieldRuns();
      Object.assign(values, structuredClone(snapshot));
      arrayKeys.clear();
      state.baseline = snapshot;
      state.errors = {};
      state.touched = new Set();
      state.submitCount = 0;
    },
    isDirty(path) {
      return !sameValue(readPath(values, path), readPath(state.baseline, path));
    },
    array(path) {
      return fieldArray(path) as never;
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

  // 单字段校验：这个字段的值变了，防抖之后运行
  for (const [path, validator] of fieldValidators) {
    watch(
      () => readPath(values, path),
      () => {
        const entry = fieldRuns.get(path) ?? {};
        fieldRuns.set(path, entry);
        clearTimeout(entry.timer);
        entry.timer = setTimeout(() => void runField(path, validator), validator.debounce ?? 300);
      },
      { deep: true },
    );
  }

  return controller;
}
