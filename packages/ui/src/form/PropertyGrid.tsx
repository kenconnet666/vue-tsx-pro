/**
 * 属性面板（div）：按字段描述（property-types.ts）画一组“名字加编辑器”的行，改了马上经 onSet 交出去——编辑器的检查器、
 * 设计器的属性栏、调参面板（同 Unity 的 Inspector、Godot 的 EditorInspector、Tweakpane）。和 SchemaForm 不同：没有提交、
 * 校验、错误汇总，每处修改是一次“路径加值”，值由使用方存（撤销、多选、写文件都在那边）。
 *
 *   <PropertyGrid fields={lightFields} value={light} onSet={(path, value) => (light = setPropertyPath(light, path, value))} />
 *   <PropertyEditor type={{ kind: 'vector', size: 3 }} value={position} onSet={…} />   只有一个值
 *
 * - 行：名字在起始边、编辑器在后面；对象、列表、几种之一这类复合的值名字一行、内容在下面缩进一层占满整宽（嵌深了也有宽度）。
 *   没写（可选、用默认值）的名字是次要色，写了的是正文色；必填还没设的名字是危险色、带 *；写了的可选字段、不是 null 的可空字段后面有 ×。
 *   可选字段设回默认值时去掉这个键（不写和写默认值一样）。悬停名字看说明。
 * - 多选：值里的 PROPERTY_MIXED 显示成“多个值”（数的占位、开关旁的字），改的时候给函数，每个对象各算各的。
 * - 种类：数（NumberField，向量的分量不带加减按钮）、开关、文字、枚举（Select）、向量、颜色（ColorField，线性颜色换算成 sRGB 取色，
 *   alpha 另一个数）、列表（逐项编辑、删、加一项）、对象、几种之一（先选种类，换种类时留下共有的字段）、JSON 文本（写完整才写回）。
 *   使用方自己的种类（资源、实体、旋转）经 editors 给编辑器；它们也能嵌在列表、对象里。
 *
 * 部件（data-scope="property-grid"）：Root（div）、Row（每一行的 div）、Label（名字的 span）、Value（编辑器那一格）、
 * Nested（复合值的内容）、Item（列表的一项）。
 */
import { Plus, X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { IconButton } from '../base/IconButton';
import { useLang } from '../config/context';
import { partAttrs } from '../config/styles';
import type { Lang } from '../config/lang/lang';
import { ColorField } from '../input/ColorField';
import { NumberField } from '../input/NumberField';
import { Select } from '../input/Select';
import { Switch } from '../input/Switch';
import { Textarea } from '../input/Textarea';
import { TextField } from '../input/TextField';
import { sameValue } from '../utils/data/equality';
import type { NumericFormat } from '../config/lang/format';
import { mergeAttrs, type PartProps } from '../utils/props';
import {
  emptyPropertyValue,
  hexToPropertyColor,
  propertyColorToHex,
  PROPERTY_MIXED,
  setPropertyPath,
  type PropertyField,
  type PropertyKind,
  type PropertyListType,
  type PropertyObjectType,
  type PropertyUnionType,
  type PropertyPath,
  type PropertyType,
  type PropertyUpdate,
} from './property-types';

/** 使用方自己的一种值的编辑器 */
export interface PropertyKindEditor<T extends PropertyKind> {
  /** 画编辑器：value 可能是 PROPERTY_MIXED；set 的路径相对这个值，值可以是按原来的值算的函数 */
  render: (props: {
    type: T;
    value: unknown;
    label: string;
    /** value 可以是按原来的值算的函数（PropertyUpdate） */
    set: (path: PropertyPath, value: unknown) => void;
  }) => VNodeChild;
  /** 新加一个（列表里加一项、对象的必填字段）从什么开始，默认 null */
  empty?: (type: T) => unknown;
  /** 复合的：名字一行，编辑器在下面占满整宽 */
  stacked?: boolean;
}

/** 使用方的每一种都要有编辑器 */
export type PropertyEditors<X extends PropertyKind> = {
  readonly [K in X['kind']]: PropertyKindEditor<Extract<X, { readonly kind: K }>>;
};

/** PropertyGrid 与 PropertyEditor 共有的属性 */
export interface PropertyGridOptions<X extends PropertyKind = never> {
  /**
   * 改了一处：path 相对传进来的值，value 是新值（undefined 是去掉这个键）或按原来的值算的函数。
   * 自己存值时用 setPropertyPath 落到值上
   */
  onSet: (path: PropertyPath, value: unknown) => void;
  /** 使用方自己的种类的编辑器（X 里的每一种） */
  editors?: PropertyEditors<X>;
  /** 字段显示的名字，默认 label，没有时是 name（按语言换的时候在这里查表） */
  getLabel?: (field: PropertyField<X>) => string;
  /** 字段的说明，默认 description */
  getDescription?: (field: PropertyField<X>) => string | undefined;
  /** 数的显示格式，默认不分千位、小数最多六位（坐标、强度这类值不是金额） */
  numberFormat?: NumericFormat;
}

/** 未声明的属性落到外层 div 上 */
export interface PropertyGridProps<X extends PropertyKind = never>
  extends PartProps<'div'>, PropertyGridOptions<X> {
  /** 字段 */
  fields: readonly PropertyField<X>[];
  /** 这组字段所在的对象（多选时不一样的地方是 PROPERTY_MIXED） */
  value: unknown;
}

/** 未声明的属性落到外层（复合值的内容、单个编辑器）上 */
export interface PropertyEditorProps<
  X extends PropertyKind = never,
> extends PropertyGridOptions<X> {
  /** 值的类型 */
  type: PropertyType<X>;
  /** 值 */
  value: unknown;
  /** 读屏的名称 */
  label?: string;
}

/** 部件的标记（data-scope="property-grid"） */
const propertyPart = (part: string) => partAttrs({ name: 'PropertyGrid' }, part);

/** PropertyGrid 的样式：root、row、stacked、label、unset、required、value、grow、nested、item、index、vector、mixed、json */
export const propertyGridStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(6em, 35%) minmax(0, 1fr)',
    alignItems: 'center',
    gap: '_xs',
    minHeight: '1.9em',
  },
  // 复合的值：名字一行，内容在下面占满整宽——不然每嵌一层都按比例切一刀，嵌深了输入框就没宽度了
  stacked: { display: 'flex', flexDirection: 'column', gap: '2px', minHeight: '1.9em' },
  // 写了的字段名字是正文色，没写的（用默认值）是次要色：都够对比度，一眼看出哪些写在值里
  label: { color: '_text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  unset: { color: '_textMuted' },
  required: { color: '_dangerText' },
  value: { display: 'flex', alignItems: 'center', gap: '_xs', minWidth: 0 },
  // 编辑器占满这一格（输入框、下拉框拉伸到整宽）
  grow: { flex: '1', minWidth: 0, display: 'grid' },
  nested: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingInlineStart: '_sm',
    borderInlineStartWidth: '_xs',
    borderInlineStartStyle: 'solid',
    borderInlineStartColor: '_border',
  },
  item: { display: 'flex', gap: '_xs', alignItems: 'center' },
  index: { color: '_textMuted', minWidth: '1.2em' },
  vector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(3.5em, 1fr))',
    gap: '2px',
  },
  mixed: { color: '_textMuted', fontStyle: 'italic' },
  json: { width: '_full', fontFamily: '_mono', fontSize: '0.85em' },
});

const DEFAULT_FORMAT: NumericFormat = { useGrouping: false, maximumFractionDigits: 6 };
const SMALL_BUTTON = { size: 'sm', variant: 'soft', tone: 'neutral' } as const;
const AXES = ['X', 'Y', 'Z', 'W'];

/** 画编辑器要的东西：选项加语言包，PropertyGrid 在 setup 里建一次，读的是最新的 props */
interface Context<X extends PropertyKind> {
  readonly options: PropertyGridOptions<X>;
  readonly lang: Lang;
}

const labelOf = <X extends PropertyKind>(context: Context<X>, field: PropertyField<X>) =>
  context.options.getLabel?.(field) ?? field.label ?? field.name;

const isCompound = <X extends PropertyKind>(context: Context<X>, type: PropertyType<X>) => {
  const kind = type.kind;
  if (kind === 'object' || kind === 'list' || kind === 'union') return true;
  const custom = (context.options.editors as Record<string, PropertyKindEditor<X>> | undefined)?.[
    kind
  ];
  return custom?.stacked === true;
};

const customEditor = <X extends PropertyKind>(context: Context<X>, kind: string) =>
  (context.options.editors as Record<string, PropertyKindEditor<X>> | undefined)?.[kind];

const emptyOf = <X extends PropertyKind>(context: Context<X>, type: PropertyType<X>) =>
  emptyPropertyValue(type, (custom) => customEditor(context, custom.kind)?.empty?.(custom) ?? null);

/**
 * 一行：名字加编辑器。可选字段设回默认值时不写（去掉这个键）；没写的可选对象里改一个值时整个写进去，从默认值（或空值）开始。
 */
function renderRow<X extends PropertyKind>(
  context: Context<X>,
  field: PropertyField<X>,
  value: unknown,
  onSet: (path: PropertyPath, value: unknown) => void,
): VNodeChild {
  const { lang } = context;
  const label = labelOf(context, field);
  const collapse = (next: unknown) =>
    field.optional && field.default !== undefined && sameValue(next, field.default)
      ? undefined
      : next;
  const set = (path: PropertyPath, next: unknown) => {
    if (path.length > 0 && value === undefined) {
      const base = structuredClone(field.default ?? emptyOf(context, field.type));
      return onSet([], setPropertyPath(base, path, next));
    }
    if (path.length > 0) return onSet(path, next);
    onSet(
      [],
      typeof next === 'function'
        ? (current: unknown) => collapse((next as PropertyUpdate)(current))
        : collapse(next),
    );
  };
  const missing = value === undefined;
  const shown = missing ? field.default : value;
  // 写了的可选字段（没有默认值的）、不是 null 的可空字段能去掉：可选的去掉这个键，可空的设回 null
  const clearable =
    (field.optional && field.default === undefined && !missing) ||
    (field.nullable === true && value !== null && !missing);
  const unsetRequired = !field.optional && (missing || (value === null && !field.nullable));
  const compound = isCompound(context, field.type);
  const editor = () => {
    if (field.nullable && shown === null)
      return (
        <Button
          {...SMALL_BUTTON}
          icon={Plus}
          onClick={() => onSet([], emptyOf(context, field.type))}
        >
          {lang.propertySetValue}
        </Button>
      );
    // 没写的可选对象（写了就是开着的一组设置）：先加上再改里面的值
    if (
      missing &&
      field.default === undefined &&
      (field.type.kind === 'object' || field.type.kind === 'union')
    )
      return (
        <Button
          {...SMALL_BUTTON}
          icon={Plus}
          onClick={() => onSet([], emptyOf(context, field.type))}
        >
          {lang.propertyAdd}
        </Button>
      );
    const inner = renderValue(context, field.type, shown, label, set);
    if (!clearable) return inner;
    const clearLabel = field.nullable ? lang.propertySetNull(label) : lang.propertyClear(label);
    return (
      <span {...css.attrs(propertyGridStyles.value)}>
        <span {...css.attrs(propertyGridStyles.grow)}>{inner}</span>
        <IconButton
          icon={X}
          size="sm"
          variant="ghost"
          tone="neutral"
          aria-label={clearLabel}
          title={clearLabel}
          onClick={() => onSet([], field.nullable ? null : undefined)}
        />
      </span>
    );
  };
  return (
    <div
      key={field.name}
      {...css.attrs(compound ? propertyGridStyles.stacked : propertyGridStyles.row)}
      {...propertyPart('row')}
    >
      <span
        {...css.attrs(
          propertyGridStyles.label,
          missing && propertyGridStyles.unset,
          unsetRequired && propertyGridStyles.required,
        )}
        {...propertyPart('label')}
        title={
          unsetRequired
            ? lang.propertyRequired(label)
            : (context.options.getDescription?.(field) ?? field.description)
        }
      >
        {label}
        {unsetRequired ? ' *' : ''}
      </span>
      <span {...css.attrs(propertyGridStyles.value)} {...propertyPart('value')}>
        <span {...css.attrs(propertyGridStyles.grow)}>{editor()}</span>
      </span>
    </div>
  );
}

/** 按类型画一个值的编辑器 */
function renderValue<X extends PropertyKind>(
  context: Context<X>,
  type: PropertyType<X>,
  value: unknown,
  label: string,
  onSet: (path: PropertyPath, value: unknown) => void,
): VNodeChild {
  const { lang, options } = context;
  const mixed = value === PROPERTY_MIXED;
  const number = (
    current: unknown,
    name: string,
    set: (next: number) => void,
    settings: { min?: number; max?: number; step?: number; unit?: string; compact?: boolean } = {},
  ) => (
    <NumberField
      size="sm"
      stepper={!settings.compact}
      format={options.numberFormat ?? DEFAULT_FORMAT}
      aria-label={name}
      _value={typeof current === 'number' ? current : null}
      {...(current === PROPERTY_MIXED
        ? { placeholder: settings.compact ? '—' : lang.propertyMixed, title: lang.propertyMixed }
        : {})}
      {...(settings.min !== undefined ? { min: settings.min } : {})}
      {...(settings.max !== undefined ? { max: settings.max } : {})}
      {...(settings.unit !== undefined ? { suffix: settings.unit } : {})}
      step={settings.step ?? 0.1}
      onUpdate:_value={(next: number | null) => next !== null && set(next)}
    />
  );
  const nested = (children: VNodeChild) => (
    <div {...css.attrs(propertyGridStyles.nested)} {...propertyPart('nested')}>
      {children}
    </div>
  );
  const rows = (fields: readonly PropertyField<X>[], object: Record<string, unknown>) =>
    fields.map((field) =>
      renderRow(context, field, object[field.name], (path, next) =>
        onSet([field.name, ...path], next),
      ),
    );

  const builtin = type as PropertyType;
  // 多选时整个列表、对象不一样（长短不同、有的没写）：不逐项改
  if (mixed && (builtin.kind === 'list' || builtin.kind === 'object' || builtin.kind === 'json'))
    return <span {...css.attrs(propertyGridStyles.mixed)}>{lang.propertyMixed}</span>;
  switch (builtin.kind) {
    case 'number':
      return number(value, label, (next) => onSet([], builtin.integer ? Math.round(next) : next), {
        ...builtin,
        step: builtin.step ?? (builtin.integer ? 1 : 0.1),
      });
    case 'bool':
      return (
        <span {...css.attrs(propertyGridStyles.value)}>
          <Switch
            aria-label={label}
            _checked={value === true}
            onUpdate:_checked={(next: boolean) => onSet([], next)}
          />
          {mixed && <span {...css.attrs(propertyGridStyles.mixed)}>{lang.propertyMixed}</span>}
        </span>
      );
    case 'string':
      return (
        <TextField
          size="sm"
          aria-label={label}
          _value={typeof value === 'string' ? value : ''}
          {...(mixed ? { placeholder: lang.propertyMixed } : {})}
          onUpdate:_value={(next: string) => onSet([], next)}
        />
      );
    case 'enum':
      return (
        <Select
          size="sm"
          aria-label={label}
          items={builtin.values.map((option) => ({
            value: option,
            label: builtin.labels?.[option] ?? option,
          }))}
          placeholder={lang.propertyMixed}
          _value={typeof value === 'string' ? value : null}
          onUpdate:_value={(next: string | null) => next !== null && onSet([], next)}
        />
      );
    case 'vector': {
      const items = Array.isArray(value) ? (value as unknown[]) : [];
      return (
        <div {...css.attrs(propertyGridStyles.vector)}>
          {Array.from({ length: builtin.size }, (_, i) =>
            number(
              mixed ? PROPERTY_MIXED : items[i],
              `${label} ${AXES[i] ?? i + 1}`,
              (next) => onSet([i], next),
              {
                step: builtin.step ?? 0.1,
                compact: true,
              },
            ),
          )}
        </div>
      );
    }
    case 'color': {
      const channels = Array.isArray(value)
        ? (value as unknown[])
        : mixed
          ? [PROPERTY_MIXED]
          : [0, 0, 0, 1];
      const rgbMixed = channels.slice(0, 3).some((channel) => channel === PROPERTY_MIXED);
      return (
        <span {...css.attrs(propertyGridStyles.value)}>
          <ColorField
            size="sm"
            aria-label={label}
            _value={propertyColorToHex(rgbMixed ? [0, 0, 0] : channels, builtin.space)}
            onUpdate:_value={(hex: string) =>
              onSet([], (current: unknown) =>
                hexToPropertyColor(hex, builtin.space, Array.isArray(current) ? current : []),
              )
            }
          />
          {rgbMixed && <span {...css.attrs(propertyGridStyles.mixed)}>{lang.propertyMixed}</span>}
          {builtin.alpha &&
            number(channels[3], `${label} A`, (next) => onSet([3], next), {
              min: 0,
              max: 1,
              step: 0.01,
            })}
        </span>
      );
    }
    case 'json':
      return (
        <Textarea
          {...css.attrs(propertyGridStyles.json)}
          size="sm"
          rows={3}
          aria-label={label}
          _value={JSON.stringify(value, null, 1)}
          onChange={(event: Event) => {
            try {
              onSet([], JSON.parse((event.target as HTMLTextAreaElement).value));
            } catch {
              // 写到一半的 JSON 不认，等写完整
            }
          }}
        />
      );
    // 复合的种类在下面（它们的字段里可以有使用方的种类）
    case 'list':
    case 'object':
    case 'union':
      break;
  }
  switch (type.kind) {
    case 'list': {
      const list = type as PropertyListType<X>;
      const items = Array.isArray(value) ? (value as unknown[]) : [];
      return nested([
        ...items.map((item, i) => (
          <div key={i} {...css.attrs(propertyGridStyles.item)} {...propertyPart('item')}>
            <span {...css.attrs(propertyGridStyles.index)}>{i}</span>
            <span {...css.attrs(propertyGridStyles.grow)}>
              {item === null && list.nullableItems ? (
                <span {...css.attrs(propertyGridStyles.mixed)}>{lang.propertyDefaultItem}</span>
              ) : (
                renderValue(context, list.item, item, `${label} ${i}`, (path, next) =>
                  onSet([i, ...path], next),
                )
              )}
            </span>
            <IconButton
              icon={X}
              size="sm"
              variant="ghost"
              tone="neutral"
              aria-label={lang.propertyRemoveItem(label, i)}
              title={lang.propertyRemoveItem(label, i)}
              onClick={() =>
                onSet([], (current: unknown) =>
                  Array.isArray(current) ? current.filter((_, j) => j !== i) : current,
                )
              }
            />
          </div>
        )),
        <div key="add" {...css.attrs(propertyGridStyles.item)}>
          <Button
            {...SMALL_BUTTON}
            icon={Plus}
            onClick={() => onSet([items.length], emptyOf(context, list.item))}
          >
            {lang.propertyAdd}
          </Button>
        </div>,
      ]);
    }
    case 'object': {
      const object = type as PropertyObjectType<X>;
      return nested(rows(object.fields, (value ?? {}) as Record<string, unknown>));
    }
    case 'union': {
      const union = type as PropertyUnionType<X>;
      // 多选时种类不一样：只显示共有的字段
      const object = (mixed ? { [union.tag]: PROPERTY_MIXED } : (value ?? {})) as Record<
        string,
        unknown
      >;
      const tag = object[union.tag];
      const variant = typeof tag === 'string' ? tag : undefined;
      return nested([
        <Select
          key="$tag"
          size="sm"
          aria-label={label}
          placeholder={lang.propertyMixed}
          items={Object.keys(union.variants).map((name) => ({ value: name, label: name }))}
          _value={variant ?? null}
          onUpdate:_value={(next: string | null) => {
            if (next === null || next === variant) return;
            // 换了种类：留下（每个对象自己的）共有的字段，这一种自己的必填字段从空值开始
            const fresh = Object.fromEntries(
              (union.variants[next] ?? [])
                .filter((field) => !field.optional)
                .map((field) => [field.name, field.nullable ? null : emptyOf(context, field.type)]),
            );
            onSet([], (current: unknown) => {
              const own = (current ?? {}) as Record<string, unknown>;
              const common = (union.common ?? []).map(
                (field) => [field.name, own[field.name]] as const,
              );
              return { [union.tag]: next, ...Object.fromEntries(common), ...fresh };
            });
          }}
        />,
        ...rows([...(union.common ?? []), ...((variant && union.variants[variant]) || [])], object),
      ]);
    }
  }
  const custom = customEditor(context, type.kind);
  if (!custom)
    throw new Error(
      `PropertyGrid: no editor for the property kind "${type.kind}" (pass it in editors)`,
    );
  return custom.render({ type: type as X, value, label, set: onSet });
}

/** 属性面板：一组字段，名字加编辑器 */
export const PropertyGrid = _component(
  <X extends PropertyKind = never>({
    fields,
    value,
    onSet,
    editors,
    getLabel,
    getDescription,
    numberFormat,
    ...rest
  }: PropertyGridProps<X>) => {
    const lang = useLang();
    // 选项用 getter 读最新的 props：context 只建一次
    const context: Context<X> = {
      lang,
      options: {
        get onSet() {
          return onSet;
        },
        get editors() {
          return editors;
        },
        get getLabel() {
          return getLabel;
        },
        get getDescription() {
          return getDescription;
        },
        get numberFormat() {
          return numberFormat;
        },
      } as PropertyGridOptions<X>,
    };
    return () => {
      const object = (value === PROPERTY_MIXED || value === null ? {} : (value ?? {})) as Record<
        string,
        unknown
      >;
      return (
        <div {...mergeAttrs<'div'>({ sx: propertyGridStyles.root, ...propertyPart('root') }, rest)}>
          {fields.map((field) =>
            renderRow(context, field, object[field.name], (path, next) =>
              onSet([field.name, ...path], next),
            ),
          )}
        </div>
      );
    };
  },
);

/** 一个值的编辑器（按类型）：属性面板之外单独放一个值 */
export const PropertyEditor = _component(
  <X extends PropertyKind = never>({
    type,
    value,
    label,
    onSet,
    editors,
    getLabel,
    getDescription,
    numberFormat,
  }: PropertyEditorProps<X>) => {
    const lang = useLang();
    const context: Context<X> = {
      lang,
      options: {
        get onSet() {
          return onSet;
        },
        get editors() {
          return editors;
        },
        get getLabel() {
          return getLabel;
        },
        get getDescription() {
          return getDescription;
        },
        get numberFormat() {
          return numberFormat;
        },
      } as PropertyGridOptions<X>,
    };
    return () => renderValue(context, type, value, label ?? '', onSet);
  },
);
