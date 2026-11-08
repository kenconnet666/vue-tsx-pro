/**
 * 表单设计器右边的字段属性：选中字段的名称、字段名（失焦或回车才改名，别的字段条件里的引用跟着改）、说明、必填，
 * 各类型的属性（文字的长度与格式、数字的范围、金额的小数位、选项或字典、人数、文件类型与个数、明细表的行数），
 * 顶层字段还有显示与必填条件。改动都交回新的清单。
 */
import { Plus, Trash2 } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import {
  Button,
  ConditionBuilder,
  Field,
  Flex,
  IconButton,
  NumberField,
  RadioGroup,
  Select,
  Switch,
  TextField,
  type Condition,
  type ConditionField,
} from '@zerodep-dev/vue-tsx-pro-ui';
import {
  manifestField,
  type FieldDefinition,
  type FieldOption,
  type FormManifest,
} from '@zerodep-dev/flow-ts-model';
import { without } from '../utils/object';
import { renameField, updateField } from './form-fields';

/** FieldProperties 的属性 */
export interface FieldPropertiesProps {
  /** 字段清单 */
  manifest: FormManifest;
  /** 选中的字段：明细表的列写成 `明细表.列` */
  path: string;
  /** 能选的字典名（选项可以来自它们） */
  sources?: readonly string[];
  /** 清单改了：交回新的清单 */
  onChange: (next: FormManifest) => void;
  /** 改了字段名：新的路径（设计器跟着选中它） */
  onRename: (path: string) => void;
  /** 删掉这个字段 */
  onRemove: (path: string) => void;
}

/** FieldProperties 的样式：选项一行一个 */
const fieldPropertiesStyles = css.create({
  options: { display: 'flex', flexDirection: 'column', gap: '_xs' },
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

/** 选中字段的属性 */
export const FieldProperties = _component(
  ({ manifest, path, sources = [], onChange, onRename, onRemove }: FieldPropertiesProps) => {
    // 字段名在失焦、回车时才提交：边打边改会让列表与选中跟着跳
    let nameDraft = _state(path.split('.').pop() ?? '');
    let nameProblem = _state('');

    const patch = (update: (field: FieldDefinition) => FieldDefinition) =>
      onChange(updateField(manifest, path, update));
    /** 改一个可选的属性：空值时去掉 */
    const set = <K extends keyof FieldDefinition>(key: K, value: FieldDefinition[K] | null | '') =>
      patch((field) =>
        value === null || value === '' || value === undefined
          ? (without(field, key) as FieldDefinition)
          : { ...field, [key]: value },
      );

    function commitName() {
      const name = nameDraft.trim();
      try {
        const next = renameField(manifest, path, name);
        onChange(next);
        onRename(path.includes('.') ? `${path.slice(0, path.indexOf('.'))}.${name}` : name);
      } catch (error) {
        nameProblem = error instanceof Error ? error.message : String(error);
      }
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
            <div {...css.attrs(fieldPropertiesStyles.options)}>
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
          fields={conditionFields(manifest, path)}
          _value={(field[key] as Condition | undefined) ?? null}
          onUpdate:_value={(condition: Condition | null) => set(key, condition)}
          aria-label={`“${field.label}”的${label}`}
        />
      </Field>
    );

    return () => {
      const field = manifestField(manifest, path);
      if (!field) return null;
      const column = path.includes('.');
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
          <Button variant="ghost" tone="danger" icon={Trash2} onClick={() => onRemove(path)}>
            删掉这个字段
          </Button>
        </Flex>
      );
    };
  },
);
