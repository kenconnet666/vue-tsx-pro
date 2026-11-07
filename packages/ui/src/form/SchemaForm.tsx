/**
 * 按 schema 生成的表单：useForm 的 zod schema 推出每个字段的标签与控件（schema-fields.ts），
 * 校验、必填标记、长度与范围照旧由 useForm 与字段约束负责。参考 AutoForm、Formily 的 schema 驱动，只做 zod 能表达的部分。
 *
 *   const form = useForm({ schema, initial: emptyValues(schema), onSubmit: (values) => api.apply(values) });
 *   <SchemaForm controller={form} columns={2} submitText="提交申请" />
 *   <SchemaForm controller={form} fields={{ region: () => <Cascader options={regions} /> }} />   换掉一个字段的控件
 *
 *   <Form controller={form}>                                        只生成一部分，其余手写
 *     <SchemaFields controller={form} pick={['company', 'contact']} columns={2} />
 *     <form.Field name="region" label="地区"><Cascader options={regions} /></form.Field>
 *   </Form>
 *
 * 布局：没分组的字段在最前面一组，meta 的 group 相同的放进一个 FormSection（组名是标题）；columns 是最多几栏，
 * 窄时自动减少，meta 的 span 跨栏。嵌套的对象是一个 FormSection，对象的数组是可增删的行。
 * SchemaForm 在字段前面放错误汇总（FormErrorSummary），最后一行是重置与提交按钮，children 在这一行的起始边（提交结果、说明）。
 *
 * 查询栏的条件也能用同一份描述：schemaFilters 给出一组 Field（值读写传进来的对象，不经 useForm），放进 FilterBar、
 * QueryTable 的 filters；高级筛选的字段用 schemaConditionFields。
 *
 *   <QueryTable filters={(draft) => schemaFilters(orderFilters, draft, { pick: ['keyword', 'status'] })} … />
 *
 * 部件：SchemaFields 的 Section（每一组的 FormSection）；SchemaForm 另有 Form（form）与 Actions（按钮那一行）。
 */
import { Plus, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNode, VNodeChild } from 'vue';
import type { $ZodType } from 'zod/v4/core';
import { Button } from '../base/Button';
import { IconButton } from '../base/IconButton';
import { useLang } from '../config/context';
import { DatePicker } from '../date/DatePicker';
import { Checkbox, CheckboxGroup } from '../input/Checkbox';
import { NumberField } from '../input/NumberField';
import { RadioGroup } from '../input/Radio';
import { Select } from '../input/Select';
import { Switch } from '../input/Switch';
import { Textarea } from '../input/Textarea';
import { TextField } from '../input/TextField';
import { GridItem } from '../layout/Grid';
import { cloneValue } from '../utils/data/clone';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Field } from './Field';
import { Form, type FormProps } from './Form';
import { FormErrorSummary } from './FormErrorSummary';
import { FormSection, type FormSectionProps } from './FormSection';
import { pickFields, schemaFields, type SchemaControls, type SchemaField } from './schema-fields';
import type { FieldArray, FieldPath, FormController } from './useForm';
import { partAttrs } from '../config/styles';

/** 换掉字段的控件：按字段路径给出渲染函数，返回的控件放进字段（标签、错误）里，自动绑定值 */
export type SchemaFieldRenderers<Values extends object> = {
  [P in FieldPath<Values>]?: (field: SchemaField) => VNodeChild;
};

/** SchemaFields 的属性 */
export interface SchemaFieldsProps<Values extends object> {
  /** useForm 的返回值（要有 schema） */
  controller: FormController<Values>;
  /** 只生成这些顶层字段，按这里的顺序 */
  pick?: readonly (keyof Values & string)[];
  /** 不生成这些顶层字段 */
  omit?: readonly (keyof Values & string)[];
  /** 换掉某些字段的控件 */
  fields?: SchemaFieldRenderers<Values>;
  /**
   * 最多几栏（每组各自），容器窄时自动减少
   * @default 1
   */
  columns?: number;
  /** 每一组（FormSection）的部件属性 */
  propsSection?: Partial<FormSectionProps>;
}

/** SchemaForm 的属性：SchemaFields 的全部，加上表单与按钮 */
export interface SchemaFormProps<Values extends object> extends SchemaFieldsProps<Values> {
  /** 提交按钮的文字，默认取文案（“提交”） */
  submitText?: VNodeChild;
  /** 显示重置按钮（type="reset"，回到初始值），默认 true */
  resettable?: boolean;
  /** 表单（Form）的部件属性：标签的位置、宽度等 */
  propsForm?: Partial<FormProps>;
  /** 按钮那一行的部件属性 */
  propsActions?: PartProps<'div'>;
  /** 按钮那一行起始边的内容：提交结果、说明 */
  children?: VNodeChild;
}

/** 部件的标记（data-scope="schema-form"） */
const schemaFormPart = (part: string) => partAttrs({ name: 'SchemaForm' }, part);

/** SchemaFields、SchemaForm 的样式：表单、按钮那一行、列表、列表的一行（字段与删除按钮） @internal */
export const schemaFormStyles = css.create({
  form: { display: 'flex', flexDirection: 'column', gap: '_lg' },
  actions: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '_sm' },
  actionsStart: { flexGrow: 1, minWidth: 0, color: '_textMuted', fontSize: '0.93em' },
  list: { display: 'flex', flexDirection: 'column', gap: '_md' },
  row: { display: 'flex', alignItems: 'flex-start', gap: '_sm' },
  rowFields: { flexGrow: 1, minWidth: 0 },
  // 删除按钮与第一行输入框对齐：让开标签的高度
  rowRemove: { marginBlockStart: '1.75em' },
});

/**
 * 按字段的描述选控件。extra 是额外的属性：表单里不给（Field 自动绑定值），查询栏里给值的读写与 clearable
 */
function controlOf(field: SchemaField, extra: Record<string, unknown> = {}): VNodeChild {
  const options = field.options ?? [];
  switch (field.control) {
    case 'textarea':
      return <Textarea placeholder={field.placeholder} rows={3} {...extra} />;
    case 'number':
      return <NumberField placeholder={field.placeholder} suffix={field.unit} {...extra} />;
    case 'switch':
      return <Switch {...extra} />;
    case 'checkbox':
      // 单个复选框的文字就是标签（字段的标签只给读屏，见 item）
      return <Checkbox {...extra}>{field.label}</Checkbox>;
    case 'select':
      return <Select items={options} placeholder={field.placeholder} {...extra} />;
    case 'radio':
      return <RadioGroup items={options} orientation="horizontal" {...extra} />;
    case 'multiselect':
      return (
        <Select
          items={options}
          selectionMode="multiple"
          placeholder={field.placeholder}
          {...extra}
        />
      );
    case 'checkboxes':
      return <CheckboxGroup items={options} orientation="horizontal" {...extra} />;
    case 'date':
      return <DatePicker {...extra} />;
    case 'datetime':
      return <DatePicker granularity="minute" {...extra} />;
    default:
      return <TextField placeholder={field.placeholder} {...extra} />;
  }
}

/** 查询栏里能清空的控件 */
const CLEARABLE = new Set<keyof SchemaControls>(['text', 'select', 'multiselect']);

/** schemaFilters 的选项 */
export interface SchemaFilterOptions<Values extends object> {
  /** 只要这些字段，按这里的顺序（常用的放 filters，其余的放 moreFilters） */
  pick?: readonly (keyof Values & string)[];
  /** 不要这些字段 */
  omit?: readonly (keyof Values & string)[];
  /** 换掉某些字段的控件：自己绑定值（_value={values.region}） */
  fields?: { [K in keyof Values & string]?: (field: SchemaField) => VNodeChild };
}

/**
 * 按 schema 给出查询栏的一组条件（Field 加控件）：值读写 values（QueryTable 的 draft、自己的 reactive），
 * 文字与选择可以清空。嵌套的对象与列表不生成
 */
export function schemaFilters<Values extends object>(
  schema: $ZodType<unknown, Values>,
  values: Values,
  { pick, omit, fields: renderers }: SchemaFilterOptions<Values> = {},
): VNode[] {
  const record = values as Record<string, unknown>;
  const custom = renderers as Partial<Record<string, (field: SchemaField) => VNodeChild>>;
  return pickFields(schemaFields(schema), pick, omit)
    .filter((field) => field.control !== 'object' && field.control !== 'list')
    .map((field) => {
      const prop =
        field.control === 'switch' || field.control === 'checkbox' ? '_checked' : '_value';
      const extra = {
        [prop]: record[field.key],
        [`onUpdate:${prop}`]: (value: unknown) => (record[field.key] = value),
        ...(CLEARABLE.has(field.control) ? { clearable: true } : {}),
      };
      return (
        <Field
          key={field.key}
          label={field.label}
          labelHidden={field.control === 'checkbox'}
          description={field.description}
        >
          {custom?.[field.key]?.(field) ?? controlOf(field, extra)}
        </Field>
      );
    });
}

/** 字段按 group 分成几组：没分组的在最前面，组按第一次出现的先后 */
function groupsOf(fields: readonly SchemaField[]): [string | undefined, SchemaField[]][] {
  const groups = new Map<string | undefined, SchemaField[]>([[undefined, []]]);
  for (const field of fields) groups.set(field.group, [...(groups.get(field.group) ?? []), field]);
  return [...groups].filter(([, list]) => list.length > 0);
}

/** 按 schema 生成字段（放在 Form 里） */
export const SchemaFields = _component(
  <Values extends object>({
    controller,
    pick,
    omit,
    fields: renderers,
    columns = 1,
    propsSection,
  }: SchemaFieldsProps<Values>) => {
    const lang = useLang();
    const custom = renderers as Partial<Record<string, (field: SchemaField) => VNodeChild>>;

    /** 一组字段：标题是组名或对象的标签 */
    function section(
      key: string,
      list: readonly SchemaField[],
      prefix: string,
      head: Partial<FormSectionProps> = {},
    ) {
      return (
        <FormSection
          key={key}
          {...mergePartProps<FormSectionProps>({ columns }, propsSection, head)}
        >
          {list.map((field) => item(field, prefix))}
        </FormSection>
      );
    }

    /** 对象的数组：每一行是一组字段加删除按钮，标题旁是添加按钮 */
    function rows(field: SchemaField, path: string) {
      const array = controller.array(path as never) as FieldArray<unknown>;
      const children = field.fields ?? [];
      const blank = Object.fromEntries(children.map((child) => [child.key, child.empty]));
      return (
        <GridItem key={path} span="full">
          <FormSection
            {...mergePartProps<FormSectionProps>({}, propsSection, {
              title: field.label,
              description: field.description,
              extra: (
                <Button
                  size="sm"
                  variant="soft"
                  icon={Plus}
                  onClick={() => array.append(cloneValue(blank))}
                >
                  {lang.formAddRow(field.label)}
                </Button>
              ),
            })}
          >
            <GridItem span="full">
              <div {...css.attrs(schemaFormStyles.list)}>
                {array.items.map((_, index) => (
                  <div key={array.keys[index]} {...css.attrs(schemaFormStyles.row)}>
                    <div {...css.attrs(schemaFormStyles.rowFields)}>
                      {section(`${path}.${index}`, children, `${path}.${index}.`)}
                    </div>
                    <IconButton
                      icon={Trash2}
                      variant="ghost"
                      tone="danger"
                      aria-label={lang.formRemoveRow(field.label, index + 1)}
                      onClick={() => array.remove(index)}
                      sx={schemaFormStyles.rowRemove}
                    />
                  </div>
                ))}
              </div>
            </GridItem>
          </FormSection>
        </GridItem>
      );
    }

    /** 一个字段：嵌套对象是一组，列表是可增删的行，其余是 Field 里放控件 */
    function item(field: SchemaField, prefix: string): VNodeChild {
      const path = `${prefix}${field.key}`;
      if (field.control === 'list') return rows(field, path);
      if (field.control === 'object') {
        return (
          <GridItem key={path} span="full">
            {section(path, field.fields ?? [], `${path}.`, {
              title: field.label,
              description: field.description,
            })}
          </GridItem>
        );
      }
      const control = custom?.[path]?.(field) ?? controlOf(field);
      const node = (
        <Field
          key={path}
          name={path}
          label={field.label}
          labelHidden={field.control === 'checkbox'}
          description={field.description}
        >
          {control}
        </Field>
      );
      return field.span ? (
        <GridItem key={path} span={field.span}>
          {node}
        </GridItem>
      ) : (
        node
      );
    }

    return () => {
      const all = controller.schema ? schemaFields(controller.schema) : [];
      return groupsOf(pickFields(all, pick, omit)).map(([group, list]) =>
        section(group ?? '', list, '', group === undefined ? {} : { title: group }),
      );
    };
  },
);

/** 按 schema 生成的整份表单：错误汇总、字段、提交与重置按钮 */
export const SchemaForm = _component(
  <Values extends object>({
    controller,
    submitText,
    resettable = true,
    propsForm,
    propsActions,
    children,
    ...fields
  }: SchemaFormProps<Values>) => {
    const lang = useLang();
    return () => (
      <Form {...mergePartProps<FormProps>({ controller, sx: schemaFormStyles.form }, propsForm)}>
        <FormErrorSummary />
        <SchemaFields controller={controller} {...fields} />
        <div
          {...mergeAttrs<'div'>(
            { sx: schemaFormStyles.actions, ...schemaFormPart('actions') },
            propsActions,
          )}
        >
          <div {...css.attrs(schemaFormStyles.actionsStart)} aria-live="polite">
            {children}
          </div>
          {resettable && (
            <Button type="reset" variant="soft" tone="neutral">
              {lang.formReset}
            </Button>
          )}
          <Button type="submit" loading={controller.submitting}>
            {submitText ?? lang.formSubmit}
          </Button>
        </div>
      </Form>
    );
  },
);
