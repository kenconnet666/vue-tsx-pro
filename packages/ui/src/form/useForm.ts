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
 *     <FormErrorSummary />                        // 提交没通过时在顶上列出各项错误，点了跳到字段
 *     <form.Field name="email" label="邮箱"><TextField /></form.Field>   // 只有一个控件时自动绑定值
 *     <Button type="submit" loading={form.submitting}>登录</Button>
 *   </Form>
 *
 * form.Field 里只有一个控件、控件上没写值时，自动绑定 form.values 的这个字段（同 Ant Design Form.Item 的 name）：
 * 写回的是 _value；声明了 _checked 而没有 _value 的控件（Switch、单个 Checkbox）写回 _checked，也可以用 Field 的 valueProp 指定。
 * 自己写了 _value={form.values.email} 时照旧。
 *
 * 何时显示错误（“迟一点批评、早一点肯定”）：字段失焦后才显示它的错误，之后它随输入实时更新；提交过一次之后，所有字段随输入实时更新。
 * 不属于哪个字段的错误（对象级 refine 没写 path、validate 返回的 '' 键、setError('', …)）是整份表单的错误，见 formError。
 * 字段的值经 v-model 写回，中文输入法组合输入期间不写回，所以组合中途不会触发校验。
 *
 * schema 还决定字段的约束（form-constraints.ts）：标签的必填标记、输入框的 maxlength、NumberField 的 min / max
 * 都从 schema 来，不用在控件上再写一遍。
 *
 * - 数组字段：`form.array('items')` 增删、插入、移动，给每项一个稳定的 key；错误与失焦记录跟着下标移动。
 * - 单字段异步校验：`fields: { username: { validate: (name, values, signal) => api.taken(name, { signal }) } }`，
 *   这个字段变化时防抖运行、只采用最后一次的结果，提交时等它完成；`form.validating('username')` 显示校验中。
 * - 改动：`form.dirty` 是值与初始值（或上次 reset 的值）不同；未保存离开的提醒用 useLeaveConfirmation(() => form.dirty)。
 * - 局部校验：`form.validate(['name', 'address'])` 只校验这些字段（含子路径）并显示它们的错误，分步表单进下一步前用。
 * - 字段联动：`dependencies: { confirm: ['password'] }`，password 改了重新校验 confirm（confirm 填过或失焦过时显示它的错误），
 *   confirm 的单字段校验也跟着重跑。
 */
import type { TsxComponent } from '@zerodep-dev/vue-tsx-pro-tsx';
import { computed, reactive, shallowReactive, toRaw, watch } from 'vue';
import { safeParseAsync, type $ZodIssue, type $ZodRawIssue, type $ZodType } from 'zod/v4/core';
import { useLang } from '../config/context';
import { Field, type FieldProps } from './Field';
import { createConstraints, type FieldConstraints } from './form-constraints';
import { sameValue } from '../utils/data/equality';

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

/** 字段路径 path 是否在 scope 里：就是它，或是它的子路径（'address' 包含 'address.city'） */
const inScope = (path: string, scope: readonly string[]) =>
  scope.some((prefix) => path === prefix || path.startsWith(`${prefix}.`));

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

/** 什么时候开始校验；提交过一次之后总是随输入更新 */
export interface FormValidateTimings {
  /** 失焦后（默认） */
  blur: unknown;
  /** 输入时 */
  change: unknown;
  /** 只在提交时 */
  submit: unknown;
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
  /** 什么时候开始校验，默认 blur；提交过一次之后总是随输入更新 */
  validateOn?: keyof FormValidateTimings;
  /**
   * 字段联动：字段 → 它依赖的字段。依赖的值改了就重新校验它（它填过或失焦过时显示错误），它的单字段校验也重跑。
   * 如 `{ confirm: ['password'], endDate: ['startDate'] }`
   */
  dependencies?: NoInfer<{ [P in FieldPath<Values>]?: readonly FieldPath<Values>[] }>;
  /** 校验通过后调用，拿到 schema 解析后的值（转换、默认值、coerce 都已生效）；返回 Promise 时 submitting 一直为 true 直到完成 */
  onSubmit?: (values: Output) => unknown;
}

/** 控制器里与值的类型无关的部分：Form、Field 只用到它，任何 FormController 都能交给 <Form controller> */
export interface FormControllerBase {
  /** 所有字段当前的校验错误（含还没显示的）；整份表单的错误在 '' 键上 */
  readonly errors: Readonly<FormErrors>;
  /** 整份表单的错误（不属于哪个字段），提交过之后才有；放在提交按钮旁或表单顶上 */
  readonly formError: string | undefined;
  /** 正在执行 onSubmit */
  readonly submitting: boolean;
  /** 提交过几次（不论成功与否） */
  readonly submitCount: number;
  /** 重置过几次：控件据此丢掉自己还没写回的输入（useFormReset） */
  readonly resetCount: number;
  /** 值与初始值（或上次 reset 的值）不同 */
  readonly dirty: boolean;
  /** 字段（不写时为任一字段）的单字段校验正在进行 */
  validating(path?: string): boolean;
  /** 字段的错误是否该显示：失焦过、或提交过之后才显示；Field 用它 */
  visibleError(path: string): string | undefined;
  /** 字段失焦：Field 在焦点离开字段时调用 */
  blur(path: string): void;
  /**
   * 校验整份表单，返回是否通过。给了 paths 时只看这些字段（含子路径）：它们的错误立即显示，
   * 返回它们是否都通过（分步表单进下一步前用）
   */
  validate(paths?: readonly string[]): Promise<boolean>;
  /** 提交：先校验，通过后调用 onSubmit；返回是否通过校验 */
  submit(): Promise<boolean>;
  /** 回到初始值，清空错误与失焦记录 */
  reset(): void;
  /** 字段从 schema 推出的约束（必填、长度、范围…）；Field 交给控件，控件上显式写的优先 */
  constraints(path: string): FieldConstraints;
  /** 字段的当前值（按点连接的路径）：Field 自动绑定值时用 */
  getValue(path: string): unknown;
  /** 写字段的值：中途是 null / undefined 时什么也不做 */
  setValue(path: string, value: unknown): void;
  /** 写了 name 的 Field 登记标签与控件的 id：错误汇总据此显示字段名、跳到控件。返回注销函数 */
  register(path: string, field: FormFieldInfo): () => void;
  /** 登记过的字段，按登记（渲染）的顺序 */
  readonly fields: ReadonlyMap<string, FormFieldInfo>;
}

/** Field 登记的字段信息 */
export interface FormFieldInfo {
  /** 标签的文字 */
  label: string;
  /** 控件的 id：错误汇总的链接指向它 */
  controlId: string;
}

/** 表单控制器：useForm 的返回值 */
export interface FormController<Values extends object> extends FormControllerBase {
  /** 当前值（响应式）：控件写 _value={form.values.email} */
  readonly values: Values;
  /** 回到初始值（或给定的值，之后 dirty 以它为准），清空错误与失焦记录；保存成功后写 reset(form.values) */
  reset(values?: Values): void;
  /** 字段与初始值不同 */
  isDirty(path: FieldPath<Values>): boolean;
  /** 校验整份表单，或只校验 paths 里的字段（含子路径）并显示它们的错误；返回是否通过 */
  validate(paths?: readonly FieldPath<Values>[]): Promise<boolean>;
  /** 数组字段的增删、插入、移动 */
  array<P extends ArrayPath<Values>>(
    path: P,
  ): FieldArray<NonNullable<PathValue<Values, P>> extends readonly (infer Item)[] ? Item : never>;
  /**
   * 设置某个字段的错误（如服务端返回的“邮箱已注册”），undefined 清除；'' 是整份表单的错误。
   * 校验不会冲掉它，这个字段（整份表单的错误是任一字段）的值改了之后自动消失
   */
  setError(path: FieldPath<Values> | '', message: string | undefined): void;
  /**
   * 就是 Field 组件，只是 name 的类型收窄为这份值的字段路径，写错字段名时类型检查报错：
   * `<form.Field name="email" label="邮箱">…</form.Field>`（参考 TanStack Form 的 form.Field）
   */
  readonly Field: TsxComponent<Omit<FieldProps, 'name'> & { name?: FieldPath<Values> }>;
}

/** zod issue 的路径 → 点连接的字符串 */
const issuePath = (issue: $ZodIssue) => issue.path.map(String).join('.');

/**
 * 该填的没有填：类型不对且是空值（null、undefined，包括缺少的键），或长度不够且是空字符串、空数组。
 * 选择、数字、日期控件清空后是 null（COMPONENTS.md §1 空值），z.string() 遇到它报的是类型不对，读起来应当是“必填”
 */
function isBlankIssue({ code, input }: $ZodRawIssue): boolean {
  if (code === 'invalid_type') return input == null;
  if (code === 'too_small') return input === '' || (Array.isArray(input) && input.length === 0);
  return false;
}

/** 按点连接的路径写值；中途是 null / undefined 时什么也不做 */
function writePath(target: unknown, path: string, value: unknown): void {
  const keys = path.split('.');
  const parent = readPath(target, keys.slice(0, -1).join('.'));
  if (keys.length === 1) (target as Record<string, unknown>)[keys[0]!] = value;
  else if (parent != null) (parent as Record<string, unknown>)[keys.at(-1)!] = value;
}

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
 * 复制表单的值：普通对象与数组逐层复制（各份互不影响），其余值原样保留。
 * 不用 structuredClone：Decimal、@internationalized/date 的日期这些带方法的值克隆不了（会抛错），
 * 它们本身不可变，共用同一个实例没有问题
 */
function cloneValue<T>(value: T): T {
  const raw = toRaw(value);
  if (Array.isArray(raw)) return raw.map(cloneValue) as T;
  if (raw === null || typeof raw !== 'object') return raw;
  const prototype = Object.getPrototypeOf(raw);
  if (prototype !== Object.prototype && prototype !== null) return raw;
  return Object.fromEntries(Object.entries(raw).map(([key, item]) => [key, cloneValue(item)])) as T;
}

/**
 * 创建表单控制器（组件 setup 里或模块顶层都可以）。
 * 有 schema 时值的类型取自 schema（initial 要符合它的输入类型），onSubmit 拿到解析后的输出
 */
export function useForm<Values extends object, Output = Values>(
  options: FormOptions<Values, Output>,
): FormController<Values> {
  const { schema, validateOn = 'blur', onSubmit } = options;
  const lang = useLang();
  // zod 的报错跟随语言包；schema 里自己写的提示优先于它（zod 的规则）
  const parseOptions = {
    error: (issue: $ZodRawIssue) =>
      isBlankIssue(issue) ? lang.formRequired : lang.formIssues(issue),
  };
  const fieldValidators = Object.entries(options.fields ?? {}) as [
    string,
    FieldValidator<unknown, Values>,
  ][];
  const values = reactive(cloneValue(options.initial)) as Values;
  const state = shallowReactive({
    errors: {} as FormErrors,
    // 单字段校验的结果，与 errors 分开存：整份校验不会冲掉还在路上的单字段结果
    fieldErrors: {} as FormErrors,
    // setError 给的错误与当时的值：值一改就不再算
    externalErrors: {} as Record<string, { message: string; value: unknown }>,
    touched: new Set<string>(),
    pending: new Set<string>(),
    submitting: false,
    submitCount: 0,
    resetCount: 0,
    // dirty 的比较基准：初始值，或上次 reset 的值
    baseline: cloneValue(options.initial),
  });
  // 异步校验可能乱序返回：只采用最后一次的结果
  let run = 0;
  // 正在进行的提交：校验、onSubmit 期间再次提交（连按回车）拿到同一个结果，不重复调用 onSubmit
  let submission: Promise<boolean> | undefined;
  // 最近一次通过校验时 schema 解析出的值，交给 onSubmit
  let parsed: Output | undefined;
  const constraints = createConstraints(schema);
  const dirty = computed(() => !sameValue(values, state.baseline));
  // 数组字段每项的 key，与数组等长；数组被外部整个换掉（长度不同）时重新生成
  const arrayKeys = new Map<string, string[]>();

  // 写了 name 的 Field：错误汇总按它显示字段名、跳到控件
  const fields = shallowReactive(new Map<string, FormFieldInfo>());

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
    // 依赖的字段也算进“这次校验的输入”：依赖变了，同一个值也要重新校验
    const value = cloneValue([
      readPath(values, path),
      ...dependsOn(path).map((dep) => readPath(values, dep)),
    ]);
    if (entry.running && sameValue(entry.running.value, value)) return entry.running.done;
    if (!entry.running && 'checked' in entry && sameValue(entry.checked, value)) {
      return Promise.resolve();
    }
    entry.running?.controller.abort();
    const controller = new AbortController();
    setPending(path, true);
    const done = (async () => {
      try {
        const message = await validator.validate(value[0], values, controller.signal);
        if (controller.signal.aborted) return;
        entry.checked = value;
        state.fieldErrors = { ...state.fieldErrors, [path]: message };
      } catch (error) {
        // 校验本身失败（接口出错）：当作没有结论，不挡提交（服务端还会再校验），但要报出来
        if (!controller.signal.aborted) console.error(`useForm：字段 ${path} 的校验出错`, error);
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

  /** 字段依赖的字段 */
  const dependsOn = (path: string): readonly string[] =>
    (options.dependencies as Partial<Record<string, readonly string[]>> | undefined)?.[path] ?? [];

  /**
   * 校验整份值：schema 与 validate 的错误（errors）。full 时单字段校验也立刻跑完（提交、显式调用 validate；
   * 给了 scope 时只跑 scope 里的），结果在 state.fieldErrors；失焦、输入时只算 schema 与 validate，
   * 单字段校验照旧防抖、只在它自己（或它依赖的字段）的值变了时跑
   */
  async function collect(
    full: boolean,
    scope?: readonly string[],
  ): Promise<{ errors: FormErrors; output: Output }> {
    const errors: FormErrors = {};
    let output = values as unknown as Output;
    if (schema) {
      const result = await safeParseAsync(schema, values, parseOptions);
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
    if (full) {
      await Promise.all(
        fieldValidators
          .filter(([path]) => !scope || inScope(path, scope))
          .map(([path, validator]) => runField(path, validator)),
      );
    }
    return { errors, output };
  }

  /** setError 给的错误，值改过就不算了；'' 是整份表单的错误，任一字段改了都不算 */
  function externalError(path: string): string | undefined {
    const entry = state.externalErrors[path];
    if (!entry) return undefined;
    const current = path === '' ? values : readPath(values, path);
    return sameValue(current, entry.value) ? entry.message : undefined;
  }

  /** schema 与 validate 的错误优先，再补上 setError 与单字段校验的 */
  function mergedErrors(): FormErrors {
    const merged = { ...state.errors };
    for (const path of Object.keys(state.externalErrors)) {
      const message = externalError(path);
      if (message) merged[path] ??= message;
    }
    for (const [path, message] of Object.entries(state.fieldErrors)) {
      if (message) merged[path] ??= message;
    }
    return merged;
  }

  /**
   * 校验并记下结果（只采用最后一次）；返回是否通过：算出的、setError 给的、单字段校验的都没有错误。
   * 给了 scope 时只看 scope 里的字段，别的字段的错误保持原样
   */
  async function check(full: boolean, scope?: readonly string[]): Promise<boolean> {
    const current = ++run;
    const { errors, output } = await collect(full, scope);
    if (!scope) {
      if (current === run) {
        state.errors = errors;
        parsed = output;
      }
      return Object.keys(errors).length === 0 && Object.keys(mergedErrors()).length === 0;
    }
    const scoped = (source: FormErrors) =>
      Object.entries(source).filter(([path, message]) => message && inScope(path, scope));
    if (current === run) {
      state.errors = {
        ...Object.fromEntries(
          Object.entries(state.errors).filter(([path]) => !inScope(path, scope)),
        ),
        ...Object.fromEntries(scoped(errors)),
      };
    }
    return scoped(errors).length === 0 && scoped(mergedErrors()).length === 0;
  }

  /** 把这些字段记为失焦过：它们的错误开始显示 */
  function touch(paths: readonly string[]) {
    const next = new Set(state.touched);
    for (const path of paths) next.add(path);
    if (next.size !== state.touched.size) state.touched = next;
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
    state.externalErrors = Object.fromEntries(
      Object.entries(state.externalErrors).flatMap(([key, entry]) => {
        const next = shiftIndices(key, prefix, map);
        return next === undefined ? [] : [[next, entry]];
      }),
    );
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
    get formError() {
      if (state.submitCount === 0) return undefined;
      return state.errors[''] ?? externalError('');
    },
    get submitting() {
      return state.submitting;
    },
    get resetCount() {
      return state.resetCount;
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
      // 失焦过的字段，或局部校验过的字段（含子路径：validate(['address']) 之后 address.city 也显示）
      if (state.submitCount === 0 && !inScope(path, [...state.touched])) return undefined;
      return state.errors[path] ?? externalError(path) ?? state.fieldErrors[path];
    },
    blur(path) {
      if (state.touched.has(path)) return;
      state.touched = new Set(state.touched).add(path);
      if (validateOn !== 'submit') void check(false);
    },
    validate(paths) {
      if (!paths) return check(true);
      touch(paths);
      return check(true, paths);
    },
    submit() {
      submission ??= (async () => {
        state.submitCount++;
        const valid = await check(true);
        if (!valid || !onSubmit) return valid;
        state.submitting = true;
        try {
          await onSubmit(parsed as Output);
        } finally {
          state.submitting = false;
        }
        return true;
      })().finally(() => (submission = undefined));
      return submission;
    },
    reset(next = options.initial) {
      run++;
      const snapshot = cloneValue(next);
      cancelFieldRuns();
      Object.assign(values, cloneValue(snapshot));
      arrayKeys.clear();
      state.baseline = snapshot;
      state.errors = {};
      state.externalErrors = {};
      state.touched = new Set();
      state.submitCount = 0;
      state.resetCount++;
    },
    isDirty(path) {
      return !sameValue(readPath(values, path), readPath(state.baseline, path));
    },
    array(path) {
      return fieldArray(path) as never;
    },
    setError(path, message) {
      const { [path]: _previous, ...rest } = state.externalErrors;
      const value = path === '' ? values : readPath(values, path);
      state.externalErrors =
        message === undefined ? rest : { ...rest, [path]: { message, value: cloneValue(value) } };
    },
    constraints,
    Field,
    getValue: (path) => readPath(values, path),
    setValue: (path, value) => writePath(values, path, value),
    register(path, field) {
      fields.set(path, field);
      return () => {
        if (fields.get(path) === field) fields.delete(path);
      };
    },
    fields,
  };

  // 输入时：change 模式一开始就校验；blur 模式在有字段失焦过之后（只显示失焦过的字段）；提交过之后总是
  watch(
    () => values,
    () => {
      const live =
        validateOn === 'change' ||
        state.submitCount > 0 ||
        (validateOn === 'blur' && state.touched.size > 0);
      if (live) void check(false);
    },
    { deep: true },
  );

  // 字段联动：依赖的值改了，字段填过或失焦过就显示它的错误并重新校验（单字段校验由下面的监听跟着重跑）
  for (const [path, deps] of Object.entries(options.dependencies ?? {}) as [string, string[]][]) {
    watch(
      () => deps.map((dep) => readPath(values, dep)),
      () => {
        const value = readPath(values, path);
        const filled = !(value == null || value === '' || (Array.isArray(value) && !value.length));
        if (!filled && !state.touched.has(path)) return;
        touch([path]);
        if (validateOn !== 'submit' || state.submitCount > 0) void check(false);
      },
      { deep: true },
    );
  }

  // 单字段校验：这个字段（或它依赖的字段）的值变了，防抖之后运行
  for (const [path, validator] of fieldValidators) {
    watch(
      () => [readPath(values, path), ...dependsOn(path).map((dep) => readPath(values, dep))],
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
