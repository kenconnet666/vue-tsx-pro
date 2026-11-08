/**
 * 从 zod schema 推出表单的字段：键、标签、控件、可选值、嵌套的字段。SchemaForm 按它生成表单，
 * 与字段约束（form-constraints）用同一份输入一侧的 JSON Schema。标签、说明、占位、栏宽、分组、控件写在 .meta() 里：
 *
 *   z.object({
 *     company: z.string().min(2).meta({ title: '公司全称' }),
 *     category: z.enum(['machined', 'plastic']).meta({ title: '供货品类', options: { machined: '机械件', plastic: '塑料件' } }),
 *     note: z.string().max(200).meta({ title: '补充说明', control: 'textarea', span: 'full' }),
 *   })
 *
 * 控件按类型选：字符串 → TextField（format 是 date / date-time 时 DatePicker，最长超过 100 字时 Textarea），
 * 枚举 → Select，数字（含 decimalSchema、bigintSchema）→ NumberField，布尔 → Switch，枚举的数组 → 多选的 Select，
 * 嵌套的对象 → 一组字段，对象的数组 → 可增删的行。meta 的 control 换成同类的别的控件（radio、checkboxes、checkbox、textarea）。
 * 推不出的类型（自定义类型、z.date()）是 TextField：日期用 z.iso.date()，或用 SchemaForm 的 fields 换成自己的控件。
 */
import type { $ZodType } from 'zod/v4/core';
import {
  matchesCondition,
  type Condition,
  type ConditionField,
  type ConditionFieldType,
} from '../input/condition';
import type { PeopleSource } from '../input/people';
import type { UploadHandler } from '../input/Upload';
import { cloneValue } from '../utils/data/clone';
import { groupDigits, sumNumeric } from '../utils/data/numeric';
import { toJsonSchema, unwrap, type JsonSchema } from './form-constraints';

/** SchemaForm 能生成的控件 */
export interface SchemaControls {
  /** 单行文字：TextField */
  text: unknown;
  /** 多行文字：Textarea */
  textarea: unknown;
  /** 数字：NumberField */
  number: unknown;
  /** 开关：Switch */
  switch: unknown;
  /** 单个复选框：Checkbox */
  checkbox: unknown;
  /** 下拉单选：Select */
  select: unknown;
  /** 单选组：RadioGroup（选项少时） */
  radio: unknown;
  /** 下拉多选：Select 的多选 */
  multiselect: unknown;
  /** 复选组：CheckboxGroup */
  checkboxes: unknown;
  /** 日期：DatePicker */
  date: unknown;
  /** 日期加时分：DatePicker（granularity="minute"） */
  datetime: unknown;
  /** 嵌套的对象：一组字段 */
  object: unknown;
  /** 对象的数组：可增删的行 */
  list: unknown;
  /** 人员、部门：PeoplePicker（数据来自 formSources.people） */
  people: unknown;
  /** 附件：Upload（上传交给 formSources.upload） */
  file: unknown;
  /** 对象的数组排成表格（明细表）：一行一条、一列一个字段，能增删行；列写了 total 时表底有合计行 */
  table: unknown;
}

declare module 'zod/v4/core' {
  interface GlobalMeta {
    /** 输入框的占位文字（SchemaForm） */
    placeholder?: string;
    /** 用哪个控件（SchemaForm）；不写时按类型选 */
    control?: keyof SchemaControls;
    /** 占几栏（SchemaForm 分了多栏时），'full' 占满一行 */
    span?: number | 'full';
    /** 分组（SchemaForm）：同组的字段放进一个 FormSection，组名是标题 */
    group?: string;
    /** 页签（SchemaForm）：同一页签的字段放在一个标签页里（页签里照旧分组），没写的放在页签前面 */
    tab?: string;
    /** 枚举各值的显示文字（SchemaForm）；没写的值显示它自己 */
    options?: Readonly<Record<string, string>>;
    /** 数字的单位（SchemaForm），写在输入框的结束边：元、天、kg */
    unit?: string;
    /**
     * 显示条件（SchemaForm、useForm）：不成立时字段不显示、不校验（同 ConditionBuilder 的条件，字段名是同一层或顶层的键）。
     * 有条件的字段在 schema 里写成可选，条件由表单负责
     */
    visibleWhen?: Condition;
    /** 必填条件：成立时空着报“必填” */
    requiredWhen?: Condition;
    /** 只读条件：成立时控件只读 */
    readonlyWhen?: Condition;
    /** 明细表（control: 'table'）的列在表底合计：sum 求和（精确，不经过浮点数） */
    total?: 'sum';
    /** 选项来自登记的来源（createUi 的 formSources.options，或 SchemaFields 的 sources）：字典名、远程搜索的名字 */
    source?: string;
  }
}

/** 一个可选值 */
export interface SchemaOption {
  /** 值 */
  value: string;
  /** 显示的文字 */
  label: string;
}

/** 一个字段的描述 */
export interface SchemaField {
  /** 键（在父对象里）；完整路径由所在的位置拼出 */
  key: string;
  /** 标签：meta 的 title，没写时是键 */
  label: string;
  /** 说明：meta 的 description */
  description?: string;
  /** 占位文字 */
  placeholder?: string;
  /** 控件 */
  control: keyof SchemaControls;
  /** 可选值（select、radio、multiselect、checkboxes） */
  options?: readonly SchemaOption[];
  /** 数字的单位 */
  unit?: string;
  /** 占几栏 */
  span?: number | 'full';
  /** 分组 */
  group?: string;
  /** 页签 */
  tab?: string;
  /** 嵌套对象的字段、列表每一行的字段 */
  fields?: readonly SchemaField[];
  /** 空着时的值：新的一行、emptyValues 用它（必填的选择、数字、日期是 null，可选的是 undefined） */
  empty: unknown;
  /** 显示条件（meta） */
  visibleWhen?: Condition;
  /** 必填条件（meta） */
  requiredWhen?: Condition;
  /** 只读条件（meta） */
  readonlyWhen?: Condition;
  /** 明细表的列在表底合计（meta） */
  total?: 'sum';
  /** 选项来源的名字（meta）：formSources.options 里登记的 */
  source?: string;
}

/** 一个选项来源：固定的列表（字典），或按搜索词远程取（供应商、件号） */
export type OptionSource =
  | readonly SchemaOption[]
  | ((query: string, signal: AbortSignal) => Promise<readonly SchemaOption[]>);

/**
 * 表单的数据来源（宿主登记，按名字引用）：选择题的选项（字典、远程搜索）、人员与部门、上传。
 * createUi 的 formSources 登记一次，SchemaFields 的 sources 可以局部覆盖
 */
export interface FormSources {
  /** 选项来源：名字 → 列表或远程搜索；字段的 meta 写 source: '名字' */
  readonly options?: Readonly<Record<string, OptionSource>>;
  /** 人员、部门（control: 'people'） */
  readonly people?: PeopleSource;
  /** 上传（control: 'file'）；不给时用应用的请求客户端传到 formSources 之外的 action */
  readonly upload?: UploadHandler;
}

/**
 * 字段的权限（useForm 的 access，按字段路径）：hidden 不显示、不校验，readonly 只读、不算必填，editable 照 schema 与条件，
 * required 必填。流程的环节权限（字段 × 环节）直接映射过来；明细表的列没写时跟着明细表
 */
export type SchemaFieldAccess = 'hidden' | 'readonly' | 'editable' | 'required';

/** 字段此刻的样子 */
export interface SchemaFieldState {
  /** 显示（不显示的不渲染、不校验） */
  readonly visible: boolean;
  /** 只读 */
  readonly readonly: boolean;
  /** 条件或权限要求必填（schema 本身的必填另算） */
  readonly required: boolean;
}

const META_KEYS = [
  'title',
  'description',
  'placeholder',
  'control',
  'span',
  'group',
  'tab',
  'options',
  'unit',
  'visibleWhen',
  'requiredWhen',
  'readonlyWhen',
  'total',
  'source',
] as const;
type Meta = { [K in (typeof META_KEYS)[number]]?: unknown };

/** 节点上写的 meta（JSON Schema 里与 meta 同名的键） */
function metaOf(node: JsonSchema | undefined): Meta {
  const meta: Meta = {};
  for (const key of META_KEYS) if (node?.[key] !== undefined) meta[key] = node[key];
  return meta;
}

const text = (value: unknown) => (typeof value === 'string' ? value : undefined);

/** 枚举的可选值：只认字符串（Select、RadioGroup 的值是字符串） */
function optionsOf(node: JsonSchema | undefined, labels: unknown): SchemaOption[] | undefined {
  if (!Array.isArray(node?.enum)) return undefined;
  const names = (labels ?? {}) as Record<string, unknown>;
  return node.enum
    .filter((value): value is string => typeof value === 'string')
    .map((value) => ({ value, label: text(names[value]) ?? value }));
}

/** 按类型与 meta 选控件 */
function controlOf(node: JsonSchema, meta: Meta): keyof SchemaControls {
  const asked = text(meta.control) as keyof SchemaControls | undefined;
  const type = node.type;
  const fallback = (): keyof SchemaControls => {
    // 选项来自登记的来源：数组是多选，否则是下拉
    if (text(meta.source)) return type === 'array' ? 'multiselect' : 'select';
    if (Array.isArray(node.enum)) return 'select';
    if (type === 'number' || type === 'integer') return 'number';
    if (type === 'boolean') return 'switch';
    if (type === 'object') return 'object';
    if (type === 'array') {
      const item = node.items as JsonSchema | undefined;
      return item?.type === 'object' ? 'list' : 'multiselect';
    }
    if (node.format === 'date') return 'date';
    if (node.format === 'date-time') return 'datetime';
    return typeof node.maxLength === 'number' && node.maxLength > 100 ? 'textarea' : 'text';
  };
  return asked ?? fallback();
}

/** 空着时的值 */
function emptyOf(
  control: keyof SchemaControls,
  node: JsonSchema,
  optional: boolean,
  nullable: boolean,
  fields: readonly SchemaField[] | undefined,
): unknown {
  if ('default' in node) return node.default;
  switch (control) {
    case 'text':
    case 'textarea':
      return '';
    case 'switch':
    case 'checkbox':
      return false;
    case 'multiselect':
    case 'checkboxes':
    case 'list':
    case 'table':
    case 'people':
    case 'file':
      return [];
    case 'object':
      return Object.fromEntries((fields ?? []).map((field) => [field.key, field.empty]));
    default:
      // 选择、数字、日期：必填的给 null（校验报“必填”），可选的给 undefined（不填也能过）
      return nullable || !optional ? null : undefined;
  }
}

/** 对象节点的各个字段 */
function fieldsOf(root: JsonSchema, object: JsonSchema): SchemaField[] {
  const properties = (object.properties ?? {}) as Record<string, JsonSchema>;
  const required = (object.required as string[] | undefined) ?? [];
  return Object.entries(properties).map(([key, raw]) => {
    const { node = {}, nullable } = unwrap(root, raw);
    // 包在外面的 meta（.nullable().meta(…)）优先于里面的
    const meta = { ...metaOf(node), ...metaOf(raw) };
    const control = controlOf(node, meta);
    const item =
      node.type === 'array' ? unwrap(root, node.items as JsonSchema | undefined).node : undefined;
    const fields =
      control === 'object'
        ? fieldsOf(root, node)
        : (control === 'list' || control === 'table') && item
          ? fieldsOf(root, item)
          : undefined;
    const field: SchemaField = {
      key,
      label: text(meta.title) ?? key,
      control,
      empty: emptyOf(control, node, !required.includes(key), nullable, fields),
    };
    const options = optionsOf(
      control === 'multiselect' || control === 'checkboxes' ? item : node,
      meta.options,
    );
    if (text(meta.description)) field.description = text(meta.description);
    if (text(meta.placeholder)) field.placeholder = text(meta.placeholder);
    if (text(meta.unit)) field.unit = text(meta.unit);
    if (text(meta.group)) field.group = text(meta.group);
    if (text(meta.tab)) field.tab = text(meta.tab);
    if (typeof meta.span === 'number' || meta.span === 'full') field.span = meta.span;
    if (options) field.options = options;
    if (fields) field.fields = fields;
    if (meta.total === 'sum') field.total = 'sum';
    if (text(meta.source)) field.source = text(meta.source);
    for (const name of ['visibleWhen', 'requiredWhen', 'readonlyWhen'] as const) {
      if (isCondition(meta[name])) field[name] = meta[name];
    }
    return field;
  });
}

const cache = new WeakMap<$ZodType, readonly SchemaField[]>();

const isCondition = (value: unknown): value is Condition =>
  typeof value === 'object' && value !== null;

/** 明细表一列的合计（写了 total: 'sum' 的列）：精确相加、带千分位与单位；没有能加的值时是 undefined */
export function columnTotal(column: SchemaField, rows: readonly unknown[]): string | undefined {
  if (column.total !== 'sum') return undefined;
  const sum = sumNumeric(
    rows.map((row) => (row as Record<string, unknown> | undefined)?.[column.key]),
  );
  if (sum === undefined) return undefined;
  return column.unit ? `${groupDigits(sum)} ${column.unit}` : groupDigits(sum);
}

/** 值是不是空的（null、undefined、空文字、空数组）：必填按它判断 */
export const isBlank = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

/**
 * 字段此刻的样子：权限（access）→ 显示条件 → 只读（权限或条件）→ 必填（权限、条件或 schema 的必填）。
 * read 按字段名取值：明细表的列先找同一行，再找顶层
 */
export function schemaFieldState(
  field: SchemaField,
  access: SchemaFieldAccess | undefined,
  read: (name: string) => unknown,
): SchemaFieldState {
  const holds = (condition: Condition | undefined) =>
    condition !== undefined && matchesCondition(condition, undefined, (_, name) => read(name));
  if (access === 'hidden' || (field.visibleWhen && !holds(field.visibleWhen)))
    return { visible: false, readonly: true, required: false };
  const readonly = access === 'readonly' || holds(field.readonlyWhen);
  return {
    visible: true,
    readonly,
    required: !readonly && (access === 'required' || holds(field.requiredWhen)),
  };
}

/**
 * 逐个走值里的字段（明细表逐行逐列），给出路径、字段与它此刻的样子：useForm 据此跳过隐藏字段的错误、补条件必填，
 * SchemaFields 据此显示与只读。列没写权限时跟着明细表
 */
export function walkSchemaFields(
  fields: readonly SchemaField[],
  values: Readonly<Record<string, unknown>>,
  access: Readonly<Partial<Record<string, SchemaFieldAccess>>>,
  visit: (path: string, field: SchemaField, state: SchemaFieldState) => void,
  prefix = '',
  scope: Readonly<Record<string, unknown>> = values,
  inherited?: SchemaFieldAccess,
): void {
  const read = (name: string) => (name in scope ? scope[name] : values[name]);
  for (const field of fields) {
    const path = `${prefix}${field.key}`;
    const own = access[path.replace(/\.\d+\./g, '.')] ?? inherited;
    const state = schemaFieldState(field, own, read);
    visit(path, field, state);
    if (!state.visible || !field.fields) continue;
    const value = scope[field.key];
    if ((field.control === 'list' || field.control === 'table') && Array.isArray(value)) {
      value.forEach((row, index) =>
        walkSchemaFields(field.fields!, values, access, visit, `${path}.${index}.`, row ?? {}, own),
      );
    } else if (field.control === 'object' && value && typeof value === 'object') {
      walkSchemaFields(
        field.fields,
        values,
        access,
        visit,
        `${path}.`,
        value as Record<string, unknown>,
        own,
      );
    }
  }
}

/** schema（对象）→ 各个字段的描述，按 schema 缓存；不是对象的 schema 没有字段 */
export function schemaFields(schema: $ZodType): readonly SchemaField[] {
  let fields = cache.get(schema);
  if (!fields) {
    const root = toJsonSchema(schema);
    const { node } = root ? unwrap(root, root) : { node: undefined };
    fields = root && node?.type === 'object' ? fieldsOf(root, node) : [];
    cache.set(schema, fields);
  }
  return fields;
}

/**
 * 按 schema 给出一份空白的初始值（useForm 的 initial）：文字是 ''、开关是 false、数组是 []，
 * 必填的选择、数字、日期是 null（校验报“必填”），写了 .default() 的用默认值
 *
 *   const form = useForm({ schema, initial: emptyValues(schema), onSubmit });
 */
export function emptyValues<Input extends object>(schema: $ZodType<unknown, Input>): Input {
  return Object.fromEntries(
    schemaFields(schema).map((field) => [field.key, cloneValue(field.empty)]),
  ) as Input;
}

/** 只要这些顶层字段（按 pick 的顺序），或者去掉 omit 里的 @internal */
export function pickFields(
  fields: readonly SchemaField[],
  pick?: readonly string[],
  omit?: readonly string[],
): SchemaField[] {
  return pick
    ? pick.flatMap((key) => fields.filter((field) => field.key === key))
    : fields.filter((field) => !omit?.includes(field.key));
}

/** 控件 → 条件构造器的字段类型；嵌套的对象、列表不能当条件 */
const CONDITION_TYPES: Partial<Record<keyof SchemaControls, ConditionFieldType>> = {
  text: 'text',
  textarea: 'text',
  number: 'number',
  date: 'date',
  datetime: 'date',
  select: 'select',
  radio: 'select',
  multiselect: 'select',
  checkboxes: 'select',
  switch: 'boolean',
  checkbox: 'boolean',
};

/**
 * schema → 条件构造器的字段（ConditionBuilder、FilterBar 的 conditionFields）：标签、类型、可选值与表单、查询栏同一份描述
 *
 *   <FilterBar conditionFields={schemaConditionFields(orderSchema, { omit: ['keyword'] })} _condition={condition}>…</FilterBar>
 */
export function schemaConditionFields(
  schema: $ZodType,
  { pick, omit }: { pick?: readonly string[]; omit?: readonly string[] } = {},
): ConditionField[] {
  return pickFields(schemaFields(schema), pick, omit).flatMap((field) => {
    const type = CONDITION_TYPES[field.control];
    if (!type) return [];
    const condition: ConditionField = { name: field.key, label: field.label, type };
    if (field.group) condition.group = field.group;
    if (field.options) condition.options = field.options;
    return [condition];
  });
}
