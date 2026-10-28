/**
 * 条件构造器：编辑 all / any / not 加比较的条件树（Condition，见 condition.ts）。每条是“字段 · 比较方式 · 值”，
 * 比较方式随字段类型、值的输入随字段类型与比较方式；组的表头选满足方式（全部、任一、都不、不全），组里还能再加组。
 *
 *   const fields: ConditionField[] = [
 *     { name: 'amount', label: '金额', type: 'number' },
 *     { name: 'category', label: '品类', type: 'select', options: [{ value: 'steel', label: '钢材' }, …] },
 *     { name: 'owner', label: '经办人', type: 'select', input: ({ value, onChange, label }) => <UserPicker … /> },
 *   ];
 *   let condition = _state<Condition | null>(null);
 *   <ConditionBuilder fields={fields} _value={condition} aria-label="审批条件" />
 *
 * 写回的是只含填完整的比较的条件：没选字段、没填值的那几条留在界面上，不进 _value；一条也没有时是 null。
 * 根总是一个组（{ all }、{ any }，都不满足是 { not: { any } }，不全满足是 { not: { all } }）；
 * 传进来的单条比较、嵌套的 not 按同样的规则读成组。父级改了 _value（与上次写回的不同）时整棵重读。
 *
 * 读屏：根与每个嵌套的组是 role="group"，每条比较也是一组（“条件 2”），三个控件各有名称（“字段”“比较方式”“金额的值”）。
 * 加了一条之后焦点落到它的字段上；删掉之后落到组的“添加条件”上。
 * 部件：Root（div）、Group（每个组）、Rule（每条比较）。
 */
import { Plus, Trash2, X } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import * as css from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { nextTick, watch, type VNodeChild } from 'vue';
import { Button } from '../base/Button';
import { IconButton } from '../base/IconButton';
import { Small } from '../base/Text';
import { useLang } from '../config/context';
import { t } from '../config/theme/tokens';
import { DatePicker } from '../date/DatePicker';
import { DateRangePicker } from '../date/DateRangePicker';
import { dataAttrs, mergeAttrs, type PartProps } from '../utils/props';
import type { TextSize } from '../utils/style/typography';
import {
  isRuleComplete,
  operatorLabel,
  toText,
  operatorsOf,
  valueShape,
  type Condition,
  type ConditionField,
  type ConditionOp,
  type ConditionRule,
} from './condition';
import { NumberField } from './NumberField';
import { NumberRangeField } from './NumberRangeField';
import { Select } from './Select';
import { TagsInput } from './TagsInput';
import { TextField } from './TextField';

/** 组的满足方式 */
export interface ConditionModes {
  /** 全部满足：{ all } */
  all: unknown;
  /** 任一满足：{ any } */
  any: unknown;
  /** 都不满足：{ not: { any } } */
  none: unknown;
  /** 不全满足：{ not: { all } } */
  notAll: unknown;
}

/** 组的满足方式 */
export type ConditionMode = keyof ConditionModes;

/** 未声明的属性落到外层 div（role="group"）上：aria-label 写条件管什么 */
export interface ConditionBuilderProps extends PartProps<'div', 'role'> {
  /** 能参与比较的字段 */
  fields: readonly ConditionField[];
  /** 条件：父级写 _value={condition} 双向绑定；没有填完整的比较时是 null */
  _value?: Condition | null;
  /** 组最多嵌套几层，默认 2（根组里还能加一层组）；1 时不能加组 */
  maxDepth?: number;
  /** 控件与按钮的字号档位，不写时继承 */
  size?: TextSize;
  /** 不可用 */
  disabled?: boolean;
  /** 每个组的部件属性 */
  propsGroup?: PartProps<'div'>;
  /** 每条比较的部件属性 */
  propsRule?: PartProps<'div'>;
}

interface RuleNode {
  kind: 'rule';
  id: number;
  field: string | null;
  op: ConditionOp | null;
  value: unknown;
}

interface GroupNode {
  kind: 'group';
  id: number;
  mode: ConditionMode;
  children: (RuleNode | GroupNode)[];
}

const MODES: readonly ConditionMode[] = ['all', 'any', 'none', 'notAll'];

/** ConditionBuilder 的样式：root、group、nested、header、rows、row、joiner、rule、field、op、value、range、actions、empty */
export const conditionBuilderStyles = css.create({
  root: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: 0 },
  group: { display: 'flex', flexDirection: 'column', gap: '_sm', minWidth: 0 },
  // 嵌套的组：浅底加描边，和外层的条件分开
  nested: {
    flexGrow: 1,
    padding: '_sm',
    backgroundColor: '_surfaceMuted',
    borderWidth: '_xs',
    borderStyle: 'solid',
    borderColor: '_borderMuted',
    borderRadius: '_md',
  },
  header: { display: 'flex', alignItems: 'center', gap: '_sm' },
  rows: { display: 'flex', flexDirection: 'column', gap: '_sm' },
  row: { display: 'flex', alignItems: 'flex-start', gap: '_sm', minWidth: 0 },
  // 连接词（且、或）一列，宽度固定：各条的字段对齐
  joiner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexShrink: 0,
    width: '2em',
    // 与控件同高：连接词对着这一条的第一行
    minHeight: `max(${t.sizes.control}, ${t.sizes.minTarget})`,
    color: '_textMuted',
  },
  rule: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: '_sm',
    flexGrow: 1,
    minWidth: 0,
  },
  field: { flexGrow: 1, flexShrink: 1, flexBasis: '9rem', minWidth: '7rem', maxWidth: '14rem' },
  op: { flexGrow: 0, flexShrink: 1, flexBasis: '8rem', minWidth: '6rem' },
  // grid：里面的输入框拉满这一格（多选的标签按这个宽度排）
  value: { display: 'grid', flexGrow: 2, flexShrink: 1, flexBasis: '12rem', minWidth: '8rem' },
  range: { display: 'flex', alignItems: 'center', gap: '_xs' },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '_xs',
    paddingInlineStart: 'calc(2em + 0.5rem)',
  },
  actionsRoot: { paddingInlineStart: 0 },
  removeGroup: { marginInlineStart: 'auto' },
  empty: { color: '_textMuted' },
});

let nextId = 0;
const rule = (
  field: string | null = null,
  op: ConditionOp | null = null,
  value?: unknown,
): RuleNode => ({
  kind: 'rule',
  id: ++nextId,
  field,
  op,
  value,
});
const group = (mode: ConditionMode, children: (RuleNode | GroupNode)[] = []): GroupNode => ({
  kind: 'group',
  id: ++nextId,
  mode,
  children,
});

/** 条件读成界面上的组：not 包着 any 是“都不满足”、包着 all 是“不全满足”，包着单条比较是只有它的“都不满足” */
function toGroup(condition: Condition): GroupNode {
  if ('all' in condition) return group('all', condition.all.map(toNode));
  if ('any' in condition) return group('any', condition.any.map(toNode));
  if ('not' in condition) {
    const inner = condition.not;
    if ('not' in inner) return toGroup(inner.not);
    if ('any' in inner) return group('none', inner.any.map(toNode));
    if ('all' in inner) return group('notAll', inner.all.map(toNode));
    return group('none', [toNode(inner)]);
  }
  return group('all', [toNode(condition)]);
}

function toNode(condition: Condition): RuleNode | GroupNode {
  return 'field' in condition
    ? rule(condition.field, condition.op, condition.value)
    : toGroup(condition);
}

/** 界面上的组写回条件：只留填完整的比较，空的组去掉 */
function toCondition(node: GroupNode): Condition | null {
  const list = node.children.flatMap((child): Condition[] => {
    if (child.kind === 'group') {
      const nested = toCondition(child);
      return nested ? [nested] : [];
    }
    if (!child.field || !child.op) return [];
    const item: ConditionRule =
      valueShape(child.op) === 'none'
        ? { field: child.field, op: child.op }
        : { field: child.field, op: child.op, value: child.value };
    return isRuleComplete(item) ? [item] : [];
  });
  if (list.length === 0) return null;
  switch (node.mode) {
    case 'all':
      return { all: list };
    case 'any':
      return { any: list };
    case 'none':
      return { not: { any: list } };
    case 'notAll':
      return { not: { all: list } };
  }
}

/** 换比较方式时把值换成新的形状：一个值 ↔ 一组值 ↔ 范围，尽量留住已经填的 */
function reshape(value: unknown, op: ConditionOp): unknown {
  const first = Array.isArray(value) ? value.find((item) => item != null && item !== '') : value;
  switch (valueShape(op)) {
    case 'none':
      return undefined;
    case 'list':
      return Array.isArray(value)
        ? value.filter((item) => item != null)
        : first == null
          ? []
          : [first];
    case 'range':
      return Array.isArray(value) && value.length === 2 ? value : [first ?? null, null];
    case 'single':
      return first;
  }
}

/** 选项的值写成文字（Select 的值是文字），选中后再换回原来的值 */
const optionKey = (value: unknown) => (value == null ? null : toText(value));

/** 条件构造器 */
export const ConditionBuilder = _component(
  ({
    fields,
    _value: value = _bindable<Condition | null>(null),
    maxDepth = 2,
    size,
    disabled = false,
    propsGroup,
    propsRule,
    ...rest
  }: ConditionBuilderProps) => {
    const lang = useLang();
    let element: HTMLElement | null = null;
    // 初始值只取一次，之后由下面的 watch 跟随父级
    const initial = _untrack(value);
    // 上次写回的值：父级改成别的才整棵重读，自己写回的不重读（没填完的那几条还要留在界面上）
    let emitted = JSON.stringify(initial ?? null);
    let tree = _state<GroupNode>(initial ? toGroup(initial) : group('all'));

    watch(
      () => value,
      (next) => {
        const key = JSON.stringify(next ?? null);
        if (key === emitted) return;
        emitted = key;
        tree = next ? toGroup(next) : group('all');
      },
    );

    function commit() {
      const next = toCondition(tree);
      emitted = JSON.stringify(next);
      value = next;
    }

    const fieldOf = (name: string | null) => fields.find((field) => field.name === name);

    /** 渲染之后把焦点移到某个元素上（加了一条之后到它的字段，删掉之后到“添加条件”） */
    function focusLater(selector: string) {
      void nextTick(() => element?.querySelector<HTMLElement>(selector)?.focus());
    }

    function addRule(parent: GroupNode) {
      const added = rule();
      parent.children.push(added);
      focusLater(`[data-condition-rule="${added.id}"] [data-condition-part="field"]`);
    }

    function addGroup(parent: GroupNode) {
      const added = rule();
      parent.children.push(group('all', [added]));
      focusLater(`[data-condition-rule="${added.id}"] [data-condition-part="field"]`);
    }

    function remove(parent: GroupNode, child: RuleNode | GroupNode) {
      parent.children = parent.children.filter((item) => item !== child);
      commit();
      focusLater(`[data-condition-group="${parent.id}"] > [data-condition-part="actions"] button`);
    }

    function setField(node: RuleNode, name: string | null) {
      const field = fieldOf(name);
      node.field = name;
      const ops = field ? operatorsOf(field) : [];
      if (!node.op || !ops.includes(node.op)) node.op = ops[0] ?? null;
      // 换了字段，原来的值多半不适用：清空，是否型默认“是”
      node.value = node.op
        ? reshape(field?.type === 'boolean' ? true : undefined, node.op)
        : undefined;
      commit();
    }

    function setOp(node: RuleNode, op: ConditionOp) {
      node.op = op;
      node.value = reshape(node.value, op);
      commit();
    }

    function setValue(node: RuleNode, next: unknown) {
      node.value = next;
      commit();
    }

    /** 值的输入：随字段类型与比较方式 */
    function renderValue(node: RuleNode, field: ConditionField, op: ConditionOp): VNodeChild {
      const label = lang.conditionValue(field.label);
      const shape = valueShape(op);
      const onChange = (next: unknown) => setValue(node, next);
      const common = { size, disabled, 'aria-label': label };
      if (shape === 'none') return null;
      if (field.input) return field.input({ field, op, value: node.value, onChange, label });

      if (field.type === 'select' || field.type === 'boolean') {
        const options =
          field.type === 'boolean'
            ? [
                { value: true, label: lang.conditionTrue },
                { value: false, label: lang.conditionFalse },
              ]
            : (field.options ?? []);
        const items = options.map((option) => ({
          value: String(option.value),
          label: option.label,
        }));
        const back = (key: string | null) =>
          options.find((option) => String(option.value) === key)?.value;
        return shape === 'list' ? (
          <Select
            {...common}
            items={items}
            selectionMode="multiple"
            maxTagCount="responsive"
            _value={((node.value as unknown[] | undefined) ?? []).map(String)}
            onUpdate:_value={(keys) => onChange((keys as string[]).map(back))}
          />
        ) : (
          <Select
            {...common}
            items={items}
            _value={optionKey(node.value)}
            onUpdate:_value={(key) => onChange(back(key as string | null))}
          />
        );
      }

      if (shape === 'list') {
        return (
          <TagsInput
            {...common}
            _value={((node.value as unknown[] | undefined) ?? []).map(String)}
            onUpdate:_value={(list) =>
              onChange(
                field.type === 'number' ? list.map(Number).filter((n) => !Number.isNaN(n)) : list,
              )
            }
          />
        );
      }

      if (field.type === 'number') {
        return shape === 'range' ? (
          <NumberRangeField
            {...common}
            _value={(node.value as [number | null, number | null] | undefined) ?? [null, null]}
            onUpdate:_value={(range) => onChange([...range])}
          />
        ) : (
          <NumberField
            {...common}
            _value={(node.value as number | null | undefined) ?? null}
            onUpdate:_value={onChange}
          />
        );
      }

      if (field.type === 'date') {
        if (shape === 'range') {
          const [start, end] = (node.value as [string | null, string | null] | undefined) ?? [
            null,
            null,
          ];
          return (
            <DateRangePicker
              {...common}
              _value={start && end ? { start, end } : null}
              onUpdate:_value={(range) => onChange(range ? [range.start, range.end] : [null, null])}
            />
          );
        }
        return (
          <DatePicker
            {...common}
            _value={(node.value as string | null | undefined) ?? null}
            onUpdate:_value={onChange}
          />
        );
      }

      return (
        <TextField
          {...common}
          _value={(node.value as string | undefined) ?? ''}
          onUpdate:_value={onChange}
        />
      );
    }

    function renderRule(parent: GroupNode, node: RuleNode, index: number): VNodeChild {
      const field = fieldOf(node.field);
      const ops = field ? operatorsOf(field) : [];
      return (
        <div
          {...mergeAttrs<'div'>({ sx: conditionBuilderStyles.rule }, propsRule, {
            role: 'group',
            'aria-label': lang.conditionRule(index + 1),
            ...dataAttrs({ 'data-condition-rule': node.id }),
          })}
        >
          <Select
            items={fields.map((item) => ({
              value: item.name,
              label: item.label,
              group: item.group,
            }))}
            _value={node.field}
            onUpdate:_value={(name) => setField(node, name as string | null)}
            searchable={fields.length > 8}
            placeholder={lang.conditionField}
            aria-label={lang.conditionField}
            size={size}
            disabled={disabled}
            propsRoot={{ sx: conditionBuilderStyles.field }}
            data-condition-part="field"
          />
          <Select
            items={ops.map((op) => ({ value: op, label: operatorLabel(lang, field!.type, op) }))}
            _value={node.op}
            onUpdate:_value={(op) => op && setOp(node, op as ConditionOp)}
            aria-label={lang.conditionOperator}
            size={size}
            disabled={disabled || !field}
            propsRoot={{ sx: conditionBuilderStyles.op }}
          />
          {field && node.op && valueShape(node.op) !== 'none' && (
            <div {...css.attrs(conditionBuilderStyles.value)}>
              {renderValue(node, field, node.op)}
            </div>
          )}
          <IconButton
            icon={X}
            variant="ghost"
            size={size}
            disabled={disabled}
            aria-label={lang.conditionRemoveRule}
            onClick={() => remove(parent, node)}
          />
        </div>
      );
    }

    function renderGroup(node: GroupNode, depth: number, parent?: GroupNode): VNodeChild {
      const nested = depth > 0;
      const joiner =
        node.mode === 'any' || node.mode === 'none' ? lang.conditionOr : lang.conditionAnd;
      return (
        <div
          {...mergeAttrs<'div'>(
            { sx: [conditionBuilderStyles.group, nested && conditionBuilderStyles.nested] },
            propsGroup,
            {
              ...(nested ? { role: 'group', 'aria-label': lang.conditionGroup } : {}),
              ...dataAttrs({ 'data-condition-group': node.id }),
            },
          )}
        >
          {(node.children.length > 0 || nested) && (
            <div {...css.attrs(conditionBuilderStyles.header)}>
              <Select
                items={MODES.map((mode) => ({ value: mode, label: lang.conditionModes[mode] }))}
                _value={node.mode}
                onUpdate:_value={(mode) => {
                  if (!mode) return;
                  node.mode = mode as ConditionMode;
                  commit();
                }}
                aria-label={lang.conditionMode}
                size={size}
                disabled={disabled}
              />
              {nested && parent && (
                <IconButton
                  icon={Trash2}
                  variant="ghost"
                  size={size}
                  disabled={disabled}
                  aria-label={lang.conditionRemoveGroup}
                  onClick={() => remove(parent, node)}
                  sx={conditionBuilderStyles.removeGroup}
                />
              )}
            </div>
          )}
          {node.children.length === 0 ? (
            !nested && <Small sx={conditionBuilderStyles.empty}>{lang.conditionEmpty}</Small>
          ) : (
            <div {...css.attrs(conditionBuilderStyles.rows)}>
              {node.children.map((child, index) => (
                <div key={child.id} {...css.attrs(conditionBuilderStyles.row)}>
                  <span {...css.attrs(conditionBuilderStyles.joiner)} aria-hidden="true">
                    {index > 0 ? joiner : ''}
                  </span>
                  {child.kind === 'rule'
                    ? renderRule(node, child, index)
                    : renderGroup(child, depth + 1, node)}
                </div>
              ))}
            </div>
          )}
          <div
            {...css.attrs(
              conditionBuilderStyles.actions,
              node.children.length === 0 && conditionBuilderStyles.actionsRoot,
            )}
            data-condition-part="actions"
          >
            <Button
              variant="ghost"
              size={size}
              icon={Plus}
              disabled={disabled}
              onClick={() => addRule(node)}
            >
              {lang.conditionAddRule}
            </Button>
            {depth + 1 < maxDepth && (
              <Button
                variant="ghost"
                size={size}
                icon={Plus}
                disabled={disabled}
                onClick={() => addGroup(node)}
              >
                {lang.conditionAddGroup}
              </Button>
            )}
          </div>
        </div>
      );
    }

    return () => (
      <div
        {...mergeAttrs<'div'>({ sx: conditionBuilderStyles.root }, rest, {
          role: 'group',
          ref: (target: unknown) => (element = target as HTMLElement | null),
        })}
      >
        {renderGroup(tree, 0)}
      </div>
    );
  },
);
