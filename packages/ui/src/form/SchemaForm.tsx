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
import { Button, type ButtonProps } from '../base/Button';
import { IconButton, type IconButtonProps } from '../base/IconButton';
import { useConfig, useLang } from '../config/context';
import { DatePicker } from '../date/DatePicker';
import { Checkbox, CheckboxGroup } from '../input/Checkbox';
import { NumberField } from '../input/NumberField';
import { RadioGroup } from '../input/Radio';
import { Select } from '../input/Select';
import { Switch } from '../input/Switch';
import { PeoplePicker } from '../input/PeoplePicker';
import { Textarea } from '../input/Textarea';
import { Upload } from '../input/Upload';
import { TextField } from '../input/TextField';
import { GridItem } from '../layout/Grid';
import { Tab, TabList, TabPanel, Tabs } from '../navigation/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableFoot,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '../table/Table';
import { VisuallyHidden } from '../base/VisuallyHidden';
import { cloneValue } from '../utils/data/clone';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { Field } from './Field';
import { FieldLayoutContext } from './field-layout';
import { Form, type FormProps } from './Form';
import { FormErrorSummary } from './FormErrorSummary';
import { FormSection, type FormSectionProps } from './FormSection';
import {
  columnTotal,
  pickFields,
  schemaFields,
  type FormSources,
  type SchemaControls,
  type SchemaField,
} from './schema-fields';
import type { FieldArray, FieldPath, FormController } from './useForm';
import { partAttrs } from '../config/styles';
import { relativeFontSizes } from '../utils/style/typography';

/** 换掉字段的控件：按字段路径给出渲染函数，返回的控件放进字段（标签、错误）里，自动绑定值 */
export type SchemaFieldRenderers<Values extends object> = {
  [P in FieldPath<Values>]?: (field: SchemaField) => VNodeChild;
};

/** SchemaFields 的属性 */
export interface SchemaFieldsProps<Values extends object> {
  /** useForm 的返回值（要有 schema） */
  controller: FormController<Values>;
  /** 数据来源（字典与远程选项、人员、上传）：合并在 createUi 的 formSources 之上，同名的以这里为准 */
  sources?: FormSources;
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
  /** 数组字段“加一行”按钮的部件属性 */
  propsAddRow?: Partial<ButtonProps>;
  /** 数组字段每一行“删除”按钮的部件属性 */
  propsRemoveRow?: Partial<IconButtonProps>;
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
  /** 提交按钮的部件属性 */
  propsSubmit?: Partial<ButtonProps>;
  /** 重置按钮的部件属性 */
  propsReset?: Partial<ButtonProps>;
  /** 按钮那一行起始边的内容：提交结果、说明 */
  children?: VNodeChild;
}

/** 部件的标记（data-scope="schema-form"） */
const schemaFormPart = (part: string) => partAttrs({ name: 'SchemaForm' }, part);

/** SchemaFields、SchemaForm 的样式：表单、按钮那一行、列表、列表的一行（字段与删除按钮） @internal */
export const schemaFormStyles = css.create({
  form: { display: 'flex', flexDirection: 'column', gap: '_lg' },
  actions: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '_sm' },
  actionsStart: { flexGrow: 1, minWidth: 0, color: '_textMuted', fontSize: relativeFontSizes.sm },
  list: { display: 'flex', flexDirection: 'column', gap: '_md' },
  row: { display: 'flex', alignItems: 'flex-start', gap: '_sm' },
  rowFields: { flexGrow: 1, minWidth: 0 },
  // 删除按钮与第一行输入框对齐：让开标签的高度
  rowRemove: { marginBlockStart: '1.75em' },
  // 页签里的几组：同表单本身的间距
  tabPanel: { display: 'flex', flexDirection: 'column', gap: '_lg', paddingBlockStart: '_md' },
  // 明细表：每格放一个控件，列至少能放下输入框；合计右对齐、等宽数字
  tableCell: { minWidth: '8em', verticalAlign: 'top' },
  tableActions: { width: '1%', verticalAlign: 'top' },
  tableTotal: { fontWeight: '_semibold', fontVariantNumeric: 'tabular-nums' },
});

/**
 * 按字段的描述选控件。extra 是额外的属性：表单里不给（Field 自动绑定值），查询栏里给值的读写与 clearable
 */
function controlOf(
  field: SchemaField,
  extra: Record<string, unknown> = {},
  sources: FormSources = {},
): VNodeChild {
  // 选项来自登记的来源：固定的列表直接当 items，函数是远程搜索
  const source = field.source === undefined ? undefined : sources.options?.[field.source];
  const remote = typeof source === 'function' ? { searchable: true, load: source } : {};
  const options = (Array.isArray(source) ? source : undefined) ?? field.options ?? [];
  switch (field.control) {
    case 'people':
      if (!sources.people)
        throw new Error(`字段 ${field.key} 是人员控件，要在 createUi 的 formSources 里给 people`);
      return <PeoplePicker source={sources.people} placeholder={field.placeholder} {...extra} />;
    case 'file':
      return <Upload multiple {...(sources.upload ? { upload: sources.upload } : {})} {...extra} />;
    case 'textarea':
      return <Textarea placeholder={field.placeholder} rows={3} {...extra} />;
    case 'number':
      return (
        <NumberField
          placeholder={field.placeholder}
          suffix={field.unit}
          {...(field.valueType ? { valueType: field.valueType } : {})}
          {...extra}
        />
      );
    case 'switch':
      return <Switch {...extra} />;
    case 'checkbox':
      // 单个复选框的文字就是标签（字段的标签只给读屏，见 item）
      return <Checkbox {...extra}>{field.label}</Checkbox>;
    case 'select':
      return <Select items={options} placeholder={field.placeholder} {...remote} {...extra} />;
    case 'radio':
      return <RadioGroup items={options} orientation="horizontal" {...extra} />;
    case 'multiselect':
      return (
        <Select
          items={options}
          selectionMode="multiple"
          placeholder={field.placeholder}
          {...remote}
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
  /** 数据来源（字典与远程选项）：meta 写了 source 的字段从这里取 */
  sources?: FormSources;
}

/**
 * 按 schema 给出查询栏的一组条件（Field 加控件）：值读写 values（QueryTable 的 draft、自己的 reactive），
 * 文字与选择可以清空。嵌套的对象与列表不生成
 */
export function schemaFilters<Values extends object>(
  schema: $ZodType<unknown, Values>,
  values: Values,
  { pick, omit, fields: renderers, sources }: SchemaFilterOptions<Values> = {},
): VNode[] {
  const record = values as Record<string, unknown>;
  const custom = renderers as Partial<Record<string, (field: SchemaField) => VNodeChild>>;
  return pickFields(schemaFields(schema), pick, omit)
    .filter(
      (field) =>
        field.control !== 'object' &&
        field.control !== 'list' &&
        field.control !== 'table' &&
        field.control !== 'people' &&
        field.control !== 'file',
    )
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
          {custom?.[field.key]?.(field) ?? controlOf(field, extra, sources)}
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
    propsAddRow,
    propsRemoveRow,
    sources,
  }: SchemaFieldsProps<Values>) => {
    const lang = useLang();
    const config = useConfig();
    // 所在的 Form、FormSection 整组只读或不可用时，列表与表格也不能增删行（里面的控件已经跟着只读）
    const layout = FieldLayoutContext.inject(null);
    const locked = () => !!layout?.readonly || !!layout?.disabled;
    /** 登记的来源加上这里给的 */
    const merged = (): FormSources => {
      const base = config.formSources ?? {};
      return {
        ...base,
        ...sources,
        options: { ...base.options, ...sources?.options },
      };
    };
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

    /** 对象的数组：每一行是一组字段加删除按钮，标题旁是添加按钮；只读时不能增删行 */
    function rows(field: SchemaField, path: string, readonly: boolean) {
      const array = controller.array(path as never) as FieldArray<unknown>;
      const children = field.fields ?? [];
      const blank = Object.fromEntries(children.map((child) => [child.key, child.empty]));
      return (
        <GridItem key={path} span="full">
          <FormSection
            {...mergePartProps<FormSectionProps>({}, propsSection, {
              title: field.label,
              description: field.description,
              extra: readonly ? undefined : (
                <Button
                  {...mergePartProps<ButtonProps>(
                    { size: 'sm', variant: 'soft', icon: Plus },
                    propsAddRow,
                    { onClick: () => array.append(cloneValue(blank)) },
                  )}
                >
                  {lang.formAddRow(field.label)}
                </Button>
              ),
            })}
          >
            <GridItem span="full">
              <div {...css.attrs(schemaFormStyles.list)} {...schemaFormPart('list')}>
                {array.items.map((_, index) => (
                  <div
                    key={array.keys[index]}
                    {...css.attrs(schemaFormStyles.row)}
                    {...schemaFormPart('row')}
                  >
                    <div
                      {...css.attrs(schemaFormStyles.rowFields)}
                      {...schemaFormPart('rowFields')}
                    >
                      {section(`${path}.${index}`, children, `${path}.${index}.`)}
                    </div>
                    {!readonly && (
                      <IconButton
                        {...mergePartProps<IconButtonProps>(
                          {
                            icon: Trash2,
                            variant: 'ghost',
                            tone: 'danger',
                            'aria-label': lang.formRemoveRow(field.label, index + 1),
                            sx: schemaFormStyles.rowRemove,
                          },
                          propsRemoveRow,
                          { onClick: () => array.remove(index) },
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            </GridItem>
          </FormSection>
        </GridItem>
      );
    }

    /**
     * 明细表：一行一条、一列一个字段（格子里是去掉标签的控件，标签留给读屏），行末是删除按钮，标题旁是添加按钮；
     * 列写了 total 时表底是合计行。整列都不显示（权限、条件）时不出这一列；只读时不能增删行
     */
    function table(field: SchemaField, path: string, readonly: boolean) {
      const array = controller.array(path as never) as FieldArray<Record<string, unknown>>;
      const children = field.fields ?? [];
      const blank = Object.fromEntries(children.map((child) => [child.key, child.empty]));
      const columns = children.filter(
        (child) =>
          array.items.length === 0 ||
          array.items.some(
            (_, index) => controller.fieldState(`${path}.${index}.${child.key}`).visible,
          ),
      );
      const totals = columns.some((child) => child.total === 'sum');
      const cell = (child: SchemaField, index: number) => {
        const cellPath = `${path}.${index}.${child.key}`;
        const state = controller.fieldState(cellPath);
        return (
          <TableCell key={child.key} sx={schemaFormStyles.tableCell}>
            {state.visible && (
              <Field
                name={cellPath}
                label={`${child.label}（${lang.formRowLabel(field.label, index + 1)}）`}
                labelHidden
                {...(state.readonly ? { readonly: true } : {})}
                {...(state.required ? { required: true } : {})}
              >
                {custom?.[`${path}.${child.key}`]?.(child) ?? controlOf(child, {}, merged())}
              </Field>
            )}
          </TableCell>
        );
      };
      return (
        <GridItem key={path} span="full">
          <FormSection
            {...mergePartProps<FormSectionProps>({}, propsSection, {
              title: field.label,
              description: field.description,
              extra: readonly ? undefined : (
                <Button
                  {...mergePartProps<ButtonProps>(
                    { size: 'sm', variant: 'soft', icon: Plus },
                    propsAddRow,
                    { onClick: () => array.append(cloneValue(blank)) },
                  )}
                >
                  {lang.formAddRow(field.label)}
                </Button>
              ),
            })}
          >
            <GridItem span="full">
              <Table aria-label={field.label} {...schemaFormPart('table')}>
                <TableHead>
                  <TableRow>
                    {columns.map((child) => (
                      <TableHeaderCell key={child.key} align={child.total ? 'end' : undefined}>
                        {child.label}
                      </TableHeaderCell>
                    ))}
                    {!readonly && (
                      <TableHeaderCell sx={schemaFormStyles.tableActions}>
                        <VisuallyHidden>{lang.formRowActions}</VisuallyHidden>
                      </TableHeaderCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {array.items.length === 0 ? (
                    <TableRow>
                      <TableCell colspan={columns.length + (readonly ? 0 : 1)}>
                        {lang.tableEmpty}
                      </TableCell>
                    </TableRow>
                  ) : (
                    array.items.map((_, index) => (
                      <TableRow key={array.keys[index]}>
                        {columns.map((child) => cell(child, index))}
                        {!readonly && (
                          <TableCell sx={schemaFormStyles.tableActions}>
                            <IconButton
                              {...mergePartProps<IconButtonProps>(
                                {
                                  icon: Trash2,
                                  variant: 'ghost',
                                  tone: 'danger',
                                  'aria-label': lang.formRemoveRow(field.label, index + 1),
                                },
                                propsRemoveRow,
                                { onClick: () => array.remove(index) },
                              )}
                            />
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
                {totals && array.items.length > 0 && (
                  <TableFoot>
                    <TableRow>
                      {columns.map((child, i) => {
                        const sum = columnTotal(child, array.items);
                        return (
                          <TableCell
                            key={child.key}
                            align={child.total ? 'end' : undefined}
                            sx={schemaFormStyles.tableTotal}
                          >
                            {sum !== undefined ? sum : i === 0 ? lang.tableSummary : null}
                          </TableCell>
                        );
                      })}
                      {!readonly && <TableCell />}
                    </TableRow>
                  </TableFoot>
                )}
              </Table>
            </GridItem>
          </FormSection>
        </GridItem>
      );
    }

    /** 一个字段：嵌套对象是一组，列表是可增删的行，其余是 Field 里放控件；按权限与条件不显示、只读、必填 */
    function item(field: SchemaField, prefix: string): VNodeChild {
      const path = `${prefix}${field.key}`;
      const state = controller.fieldState(path);
      if (!state.visible) return null;
      if (field.control === 'list') return rows(field, path, state.readonly || locked());
      if (field.control === 'table') return table(field, path, state.readonly || locked());
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
      const control = custom?.[path]?.(field) ?? controlOf(field, {}, merged());
      const node = (
        <Field
          key={path}
          name={path}
          label={field.label}
          labelHidden={field.control === 'checkbox'}
          description={field.description}
          {...(state.readonly ? { readonly: true } : {})}
          {...(state.required ? { required: true } : {})}
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

    /** 字段按分组排成几组 */
    const grouped = (list: readonly SchemaField[], key: string) =>
      groupsOf(list).map(([group, members]) =>
        section(`${key}${group ?? ''}`, members, '', group === undefined ? {} : { title: group }),
      );

    const fieldsNow = () =>
      pickFields(controller.schema ? schemaFields(controller.schema) : [], pick, omit);
    /** 页签，按第一次出现的先后 */
    const tabsOf = (list: readonly SchemaField[]) => [
      ...new Set(list.flatMap((field) => (field.tab ? [field.tab] : []))),
    ];
    // 当前页签；提交没通过时 Form 聚焦出错的控件，它在别的页签里时那一页自己切过来（TabPanel 听 beforematch）
    let tab = _state(tabsOf(fieldsNow())[0] ?? '');

    return () => {
      const list = fieldsNow();
      const tabs = tabsOf(list);
      if (tabs.length === 0) return grouped(list, '');
      return [
        ...grouped(
          list.filter((field) => !field.tab),
          '',
        ),
        <Tabs key="tabs" _value={tab}>
          <TabList aria-label={lang.formTabs}>
            {tabs.map((name) => (
              <Tab key={name} value={name}>
                {name}
              </Tab>
            ))}
          </TabList>
          {tabs.map((name) => (
            <TabPanel key={name} value={name}>
              <div {...css.attrs(schemaFormStyles.tabPanel)} {...schemaFormPart('tabPanel')}>
                {grouped(
                  list.filter((field) => field.tab === name),
                  `${name}:`,
                )}
              </div>
            </TabPanel>
          ))}
        </Tabs>,
      ];
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
    propsSubmit,
    propsReset,
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
          <div
            {...css.attrs(schemaFormStyles.actionsStart)}
            {...schemaFormPart('actionsStart')}
            aria-live="polite"
          >
            {children}
          </div>
          {resettable && (
            <Button
              {...mergePartProps<ButtonProps>({ variant: 'soft', tone: 'neutral' }, propsReset, {
                type: 'reset',
              })}
            >
              {lang.formReset}
            </Button>
          )}
          <Button
            {...mergePartProps<ButtonProps>({}, propsSubmit, {
              type: 'submit',
              loading: controller.submitting,
            })}
          >
            {submitText ?? lang.formSubmit}
          </Button>
        </div>
      </Form>
    );
  },
);
