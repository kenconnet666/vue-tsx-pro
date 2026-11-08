/**
 * 表单设计器（组合）：左边加字段，中间是字段的先后（拖动排序；明细表的列在明细表下面），右边改选中字段的属性，
 * “预览”页按清单渲染成单据（useFlowForm，同审批时看到的）。改的就是字段清单本身——流程工程里 form.ts 的
 * `defineForm({...})` 字面量，代码与设计器是同一份。清单的问题（模型包的 validateManifest）列在下面，点一下选中那个字段。
 *
 *   <FormDesigner manifest={manifest} onChange={(next) => (manifest = next)} sources={['costCenters']} />
 */
import { Plus, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Alert,
  Badge,
  Button,
  ButtonBase,
  Card,
  ConditionBuilder,
  Field,
  Flex,
  IconButton,
  ItemList,
  ItemListItem,
  NumberField,
  RadioGroup,
  SchemaForm,
  Select,
  Small,
  Sortable,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  useConfig,
  type Condition,
  type ConditionField,
} from '@zerodep-dev/vue-tsx-pro-ui';
import {
  manifestField,
  manifestProblemMessage,
  validateManifest,
  type FieldDefinition,
  type FieldOption,
  type FormManifest,
} from '@zerodep-dev/flow-ts-model';
import { useFlowForm } from '../form/useFlowForm';
import { without } from './form-access';
import {
  FIELD_TYPES,
  fieldTypeLabel,
  insertField,
  orderFields,
  removeField,
  renameField,
  updateField,
} from './form-fields';

/** FormDesigner 的属性 */
export interface FormDesignerProps {
  /** 字段清单 */
  manifest: FormManifest;
  /** 清单改了：交回新的清单 */
  onChange: (next: FormManifest) => void;
  /** 能选的字典（createUi 的 formSources.options 里登记的名字）：选择字段的选项可以来自它们 */
  sources?: readonly string[];
}

/** FormDesigner 的样式：三栏（窄时上下排）、字段行、预览 */
const formDesignerStyles = css.create({
  layout: {
    display: 'grid',
    gap: '_md',
    gridTemplateColumns: {
      default: '1fr',
      '@container (min-width: 48rem)': '8rem minmax(0, 1fr) minmax(16rem, 22rem)',
    },
    alignItems: 'start',
  },
  container: { containerType: 'inline-size' },
  palette: { display: 'flex', flexDirection: 'column', gap: '_xs' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '_sm',
    width: '_full',
    paddingBlock: '_xs',
    paddingInline: '_sm',
    borderRadius: '_md',
    textAlign: 'start',
    backgroundColor: { default: null, ':hover': '_fill' },
  },
  rowSelected: { backgroundColor: '_accentSoft', color: '_accentText' },
  rowLabel: { flexGrow: 1, minWidth: 0 },
  columns: { paddingInlineStart: '_xl' },
  options: { display: 'flex', flexDirection: 'column', gap: '_xs' },
});

/** 预览：清单变了就重建表单（useFlowForm 在 setup 里取清单） */
const Preview = _component(({ manifest }: { manifest: FormManifest }) => {
  const config = useConfig();
  const form = useFlowForm({ manifest, isStart: true });
  // 人员字段要有选人的来源：应用没登记时给一个空的，预览不至于报错
  const sources = config.formSources?.people ? {} : { people: { children: async () => [] } };
  return () => <SchemaForm controller={form} columns={2} sources={sources} />;
});

/** 字段 → 条件编辑器的字段（`form.名字`，类型就近映射） */
function conditionFields(manifest: FormManifest, except: string): ConditionField[] {
  return Object.entries(manifest).flatMap(([name, field]): ConditionField[] => {
    if (name === except || field.type === 'list' || field.type === 'file') return [];
    const base = { name: `form.${name}`, label: field.label };
    switch (field.type) {
      case 'number':
      case 'decimal':
        return [{ ...base, type: 'number' }];
      case 'date':
      case 'datetime':
        return [{ ...base, type: 'date' }];
      case 'boolean':
        return [{ ...base, type: 'boolean' }];
      case 'select':
        return [
          Array.isArray(field.options)
            ? { ...base, type: 'select', options: field.options }
            : { ...base, type: 'text' },
        ];
      default:
        return [{ ...base, type: 'text' }];
    }
  });
}

/** 表单设计器 */
export const FormDesigner = _component(
  ({ manifest, onChange, sources = [] }: FormDesignerProps) => {
    let selected = _state<string | null>(Object.keys(manifest)[0] ?? null);
    let tab = _state('design');
    // 改字段名在失焦、回车时才提交：边打边改会让列表与选中跟着跳
    let nameDraft = _state('');
    let nameProblem = _state('');

    const select = (path: string | null) => {
      selected = path;
      nameDraft = path?.split('.').pop() ?? '';
      nameProblem = '';
    };
    select(selected);

    const patch = (update: (field: FieldDefinition) => FieldDefinition) => {
      if (selected) onChange(updateField(manifest, selected, update));
    };
    /** 改一个可选的属性：空值时去掉 */
    const set = <K extends keyof FieldDefinition>(key: K, value: FieldDefinition[K] | null | '') =>
      patch((field) =>
        value === null || value === '' || value === undefined
          ? (without(field, key) as FieldDefinition)
          : { ...field, [key]: value },
      );

    function add(make: () => FieldDefinition) {
      // 选中的是明细表或它的列时加成列（明细表里不能再放明细表）
      const owner = selected?.split('.')[0];
      const list = owner && manifest[owner]?.type === 'list' ? owner : undefined;
      const field = make();
      const result = insertField(manifest, field, field.type === 'list' ? undefined : list);
      onChange(result.manifest);
      select(result.path);
    }

    function commitName() {
      if (!selected) return;
      try {
        const next = renameField(manifest, selected, nameDraft.trim());
        const path = selected.includes('.')
          ? `${selected.slice(0, selected.indexOf('.'))}.${nameDraft.trim()}`
          : nameDraft.trim();
        onChange(next);
        select(path);
      } catch (error) {
        nameProblem = error instanceof Error ? error.message : String(error);
      }
    }

    function remove(path: string) {
      onChange(removeField(manifest, path));
      if (selected === path || selected?.startsWith(`${path}.`)) select(null);
    }

    /** 字段的一行：名称、类型、必填；点一下选中 */
    const row = (path: string, field: FieldDefinition) => (
      <ButtonBase
        sx={[formDesignerStyles.row, selected === path && formDesignerStyles.rowSelected]}
        aria-pressed={selected === path}
        onClick={() => select(path)}
      >
        <span {...css.attrs(formDesignerStyles.rowLabel)}>{field.label || path}</span>
        {field.required && <Badge tone="danger">必填</Badge>}
        <Small tone="muted">{fieldTypeLabel(field.type)}</Small>
      </ButtonBase>
    );

    function renderList() {
      const names = Object.keys(manifest);
      if (names.length === 0) return <Small tone="muted">从左边加字段。</Small>;
      return (
        <Sortable
          _items={names}
          onUpdate:_items={(next: string[]) => onChange(orderFields(manifest, next))}
          getKey={(name) => name}
          getLabel={(name) => manifest[name]?.label ?? name}
          aria-label="字段"
        >
          {(name: string) => {
            const field = manifest[name]!;
            const columns = field.type === 'list' ? Object.keys(field.fields ?? {}) : [];
            return (
              <Flex direction="column" gap="xs">
                {row(name, field)}
                {field.type === 'list' && (
                  <div {...css.attrs(formDesignerStyles.columns)}>
                    <Sortable
                      _items={columns}
                      onUpdate:_items={(next: string[]) =>
                        onChange(orderFields(manifest, next, name))
                      }
                      getKey={(column) => column}
                      getLabel={(column) => field.fields?.[column]?.label ?? column}
                      aria-label={`“${field.label}”的列`}
                    >
                      {(column: string) => row(`${name}.${column}`, field.fields![column]!)}
                    </Sortable>
                  </div>
                )}
              </Flex>
            );
          }}
        </Sortable>
      );
    }

    /** 选择字段的选项：值与文字一行一个 */
    function renderOptions(field: FieldDefinition) {
      const source = field.options && 'source' in field.options ? field.options.source : null;
      const options: readonly FieldOption[] =
        field.options && !('source' in field.options) ? field.options : [];
      const setOptions = (next: readonly FieldOption[]) => set('options', next);
      return [
        sources.length > 0 && (
          <Field key="from" label="选项来自">
            <RadioGroup
              orientation="horizontal"
              items={[
                { value: 'list', label: '这里写' },
                { value: 'source', label: '字典' },
              ]}
              _value={source === null ? 'list' : 'source'}
              onUpdate:_value={(from: string | null) =>
                set('options', from === 'source' ? { source: sources[0]! } : [])
              }
            />
          </Field>
        ),
        source !== null ? (
          <Field key="source" label="字典">
            <Select
              items={sources.map((name) => ({ value: name, label: name }))}
              _value={source}
              onUpdate:_value={(name: string | null) => name && set('options', { source: name })}
            />
          </Field>
        ) : (
          <Field key="options" label="选项" description="值写进单据，文字给人看">
            <div {...css.attrs(formDesignerStyles.options)}>
              {options.map((option, index) => (
                <Flex key={index} gap="xs" align="center">
                  <TextField
                    size="sm"
                    aria-label={`选项 ${index + 1} 的值`}
                    _value={String(option.value)}
                    onUpdate:_value={(value: string) =>
                      setOptions(options.map((o, i) => (i === index ? { ...o, value } : o)))
                    }
                  />
                  <TextField
                    size="sm"
                    aria-label={`选项 ${index + 1} 的文字`}
                    _value={option.label}
                    onUpdate:_value={(label: string) =>
                      setOptions(options.map((o, i) => (i === index ? { ...o, label } : o)))
                    }
                  />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    icon={Trash2}
                    aria-label={`删掉选项 ${index + 1}`}
                    onClick={() => setOptions(options.filter((_, i) => i !== index))}
                  />
                </Flex>
              ))}
              <Button
                size="sm"
                variant="ghost"
                icon={Plus}
                onClick={() =>
                  setOptions([
                    ...options,
                    { value: `v${options.length + 1}`, label: `选项${options.length + 1}` },
                  ])
                }
              >
                加选项
              </Button>
            </div>
          </Field>
        ),
        <Switch
          key="multiple"
          _checked={!!field.multiple}
          onUpdate:_checked={(on: boolean) => set('multiple', on || null)}
        >
          可以多选
        </Switch>,
      ];
    }

    /** 数字类的属性：下限、上限 */
    const range = (field: FieldDefinition, label: [string, string]) => (
      <Flex gap="sm">
        <Field label={label[0]}>
          <NumberField
            _value={typeof field.min === 'number' ? field.min : null}
            onUpdate:_value={(min: number | null) => set('min', min)}
          />
        </Field>
        <Field label={label[1]}>
          <NumberField
            _value={typeof field.max === 'number' ? field.max : null}
            onUpdate:_value={(max: number | null) => set('max', max)}
          />
        </Field>
      </Flex>
    );

    /** 按类型的属性 */
    function renderTypeProps(field: FieldDefinition) {
      switch (field.type) {
        case 'text':
          return [
            <Flex key="length" gap="sm">
              <Field label="最少字数">
                <NumberField
                  _value={field.minLength ?? null}
                  min={0}
                  onUpdate:_value={(n: number | null) => set('minLength', n)}
                />
              </Field>
              <Field label="最多字数">
                <NumberField
                  _value={field.maxLength ?? null}
                  min={1}
                  onUpdate:_value={(n: number | null) => set('maxLength', n)}
                />
              </Field>
            </Flex>,
            <Field key="pattern" label="格式" description="正则表达式，整段要符合">
              <TextField
                _value={field.pattern ?? ''}
                onUpdate:_value={(text: string) => set('pattern', text)}
              />
            </Field>,
          ];
        case 'number':
          return [
            range(field, ['最小值', '最大值']),
            <Switch
              key="integer"
              _checked={!!field.integer}
              onUpdate:_checked={(on: boolean) => set('integer', on || null)}
            >
              只能是整数
            </Switch>,
          ];
        case 'decimal':
          return (
            <Field label="小数位">
              <NumberField
                _value={field.scale ?? null}
                min={0}
                max={10}
                onUpdate:_value={(n: number | null) => set('scale', n)}
              />
            </Field>
          );
        case 'select':
          return renderOptions(field);
        case 'people':
          return (
            <Field label="最多选几个" description="不填不限">
              <NumberField
                _value={typeof field.max === 'number' ? field.max : null}
                min={1}
                onUpdate:_value={(n: number | null) => set('max', n)}
              />
            </Field>
          );
        case 'file':
          return [
            <Field key="accept" label="文件类型" description="如 .pdf,image/*；不填不限">
              <TextField
                _value={field.accept ?? ''}
                onUpdate:_value={(text: string) => set('accept', text)}
              />
            </Field>,
            <Field key="count" label="最多几个">
              <NumberField
                _value={field.maxCount ?? null}
                min={1}
                onUpdate:_value={(n: number | null) => set('maxCount', n)}
              />
            </Field>,
          ];
        case 'list':
          return (
            <Flex gap="sm">
              <Field label="最少几行">
                <NumberField
                  _value={field.minItems ?? null}
                  min={0}
                  onUpdate:_value={(n: number | null) => set('minItems', n)}
                />
              </Field>
              <Field label="最多几行">
                <NumberField
                  _value={field.maxItems ?? null}
                  min={1}
                  onUpdate:_value={(n: number | null) => set('maxItems', n)}
                />
              </Field>
            </Flex>
          );
        default:
          return null;
      }
    }

    /** 显示、必填的条件（顶层字段才有：条件比较的是单据的字段） */
    const renderCondition = (
      field: FieldDefinition,
      key: 'visibleWhen' | 'requiredWhen',
      label: string,
    ) => (
      <Field label={label} description="不写总是成立">
        <ConditionBuilder
          fields={conditionFields(manifest, selected ?? '')}
          _value={(field[key] as Condition | undefined) ?? null}
          onUpdate:_value={(condition: Condition | null) => set(key, condition)}
          aria-label={`“${field.label}”的${label}`}
        />
      </Field>
    );

    function renderProperties() {
      const field = selected ? manifestField(manifest, selected) : undefined;
      if (!selected || !field) return <Small tone="muted">选中一个字段在这里改。</Small>;
      const column = selected.includes('.');
      return (
        <Flex direction="column" gap="md">
          <Field label="名称">
            <TextField
              _value={field.label}
              onUpdate:_value={(label: string) => patch((f) => ({ ...f, label }))}
            />
          </Field>
          <Field
            label="字段名"
            description="写进单据的键；条件、权限按它"
            error={nameProblem || undefined}
          >
            <TextField
              _value={nameDraft}
              onBlur={commitName}
              onKeydown={(event: KeyboardEvent) => event.key === 'Enter' && commitName()}
            />
          </Field>
          <Field label="说明">
            <TextField
              _value={field.description ?? ''}
              onUpdate:_value={(text: string) => set('description', text)}
            />
          </Field>
          <Switch
            _checked={!!field.required}
            onUpdate:_checked={(on: boolean) => set('required', on || null)}
          >
            必填（发起时；各环节另按表单权限）
          </Switch>
          {renderTypeProps(field)}
          {!column && renderCondition(field, 'visibleWhen', '显示条件')}
          {!column && renderCondition(field, 'requiredWhen', '必填条件')}
          <Button variant="ghost" tone="danger" icon={Trash2} onClick={() => remove(selected!)}>
            删掉这个字段
          </Button>
        </Flex>
      );
    }

    return () => {
      const problems = validateManifest(manifest);
      return (
        <Flex direction="column" gap="md">
          <Tabs _value={tab}>
            <TabList aria-label="表单设计器">
              <Tab value="design">设计</Tab>
              <Tab value="preview">预览</Tab>
            </TabList>
            <TabPanel value="design">
              <div {...css.attrs(formDesignerStyles.container)}>
                <div {...css.attrs(formDesignerStyles.layout)}>
                  <div {...css.attrs(formDesignerStyles.palette)} role="group" aria-label="加字段">
                    {FIELD_TYPES.map((item) => (
                      <Button
                        key={item.type}
                        size="sm"
                        variant="soft"
                        icon={Plus}
                        onClick={() => add(item.make)}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </div>
                  <Card padding="sm">{renderList()}</Card>
                  <Card padding="md" header="字段属性">
                    {renderProperties()}
                  </Card>
                </div>
              </div>
            </TabPanel>
            <TabPanel value="preview">
              {tab === 'preview' && <Preview key={JSON.stringify(manifest)} manifest={manifest} />}
            </TabPanel>
          </Tabs>
          {problems.length > 0 && (
            <Alert tone="danger" title={`表单还有 ${problems.length} 个问题`}>
              <ItemList density="compact">
                {problems.map((problem, index) => (
                  <ItemListItem
                    key={index}
                    title={manifestProblemMessage(problem, manifest)}
                    onSelect={() => problem.field && select(problem.field)}
                  />
                ))}
              </ItemList>
            </Alert>
          )}
        </Flex>
      );
    };
  },
);
