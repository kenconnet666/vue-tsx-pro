/**
 * 按字段清单渲染单据：schema 由清单生成，字段此刻的样子（显示、必填、能不能改）用模型包的 fieldStates 合算——
 * 与后端收提交时同一套规则（节点权限、visibleWhen、requiredWhen、明细表的列跟着明细表），条件按线上形状的值算。
 *
 *   const form = useFlowForm({
 *     manifest: detail.form.manifest,
 *     access: detail.node.form,          // 节点上的字段权限；发起页写 isStart
 *     values: detail.instance.variables, // 单据现在的值（线上的形状）
 *     onSubmit: (values) => client.complete(detail.workItem.id, { outcome: 'approve', values }),
 *   });
 *   <SchemaForm controller={form} columns={2} />
 */
import { getLocalTimeZone } from '@internationalized/date';
import {
  fieldStates,
  type ConditionReader,
  type FieldState,
  type FormManifest,
  type NodeFormAccess,
} from '@zerodep-dev/flow-ts-model';
import {
  emptyValues,
  useForm,
  type FieldAccessMap,
  type FormController,
  type SchemaFieldAccess,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { manifestSchema } from './manifest-schema';
import { fromFormValues, toFormValues } from './form-values';

/** manifestAccess 的输入 */
export interface ManifestAccessInput {
  /** 节点上的字段权限；不在待办里看单据的人传流程级的 formView */
  access?: NodeFormAccess | undefined;
  /** 是不是发起：没写 default 时发起可改、其他节点只读 */
  isStart?: boolean | undefined;
  /** 表单里的值 */
  values: unknown;
  /** 条件里 `form.` 以外的字段（流程变量、`sys.` 等）怎么取；不给时取不到（undefined） */
  read?: ConditionReader | undefined;
  /** 日期时间按哪个时区（同 useFlowForm） */
  timeZone: string;
}

const accessOf = (state: FieldState): SchemaFieldAccess =>
  !state.visible
    ? 'hidden'
    : !state.editable
      ? 'readonly'
      : state.required
        ? 'required'
        : 'editable';

/** 字段在这个节点上的权限，给 useForm 的 access、SchemaView 的 access：模型包的 fieldStates 换成组件库的写法 */
export function manifestAccess(manifest: FormManifest, input: ManifestAccessInput): FieldAccessMap {
  const typed = fromFormValues(manifest, input.values, input.timeZone);
  const states = fieldStates(manifest, {
    access: input.access,
    isStart: input.isStart,
    read: (field) => (field.startsWith('form.') ? typed[field.slice(5)] : input.read?.(field)),
  });
  return Object.fromEntries([...states].map(([path, state]) => [path, accessOf(state)]));
}

/** useFlowForm 的选项 */
export interface FlowFormOptions extends Omit<ManifestAccessInput, 'values' | 'timeZone'> {
  /** 字段清单（待办详情、发起视图里的 form.manifest） */
  manifest: FormManifest;
  /** 单据现在的值（线上的形状：Decimal、CalendarDate、ZonedDateTime）；发起时不给，用清单的 default */
  values?: Record<string, unknown> | undefined;
  /** 日期时间按哪个时区显示、填写，默认浏览器的时区 */
  timeZone?: string | undefined;
  /** 校验通过后提交：值已经换回线上的形状，隐藏的字段不带 */
  onSubmit?: (values: Record<string, unknown>) => void | Promise<void>;
}

/** 清单里写的 default（人写的文字读成强类型） */
function defaults(manifest: FormManifest): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(manifest).flatMap(([name, field]) =>
      field.default === undefined ? [] : [[name, field.default]],
    ),
  );
}

/** 按字段清单建表单：返回 useForm 的控制器，交给 SchemaForm、SchemaFields */
export function useFlowForm(options: FlowFormOptions): FormController<Record<string, unknown>> {
  const { manifest, onSubmit } = options;
  const timeZone = options.timeZone ?? getLocalTimeZone();
  const schema = manifestSchema(manifest);
  const initial = {
    ...emptyValues(schema),
    ...toFormValues(
      manifest,
      fromFormValues(manifest, options.values ?? defaults(manifest), timeZone),
      timeZone,
    ),
  };
  const access = (values: unknown) =>
    manifestAccess(manifest, {
      access: options.access,
      isStart: options.isStart,
      read: options.read,
      values,
      timeZone,
    });
  return useForm({
    schema,
    initial,
    access,
    onSubmit: async (values: Record<string, unknown>) => {
      const hidden = Object.entries(access(values)).flatMap(([path, state]) =>
        state === 'hidden' && !path.includes('.') ? [path] : [],
      );
      const submitted = fromFormValues(manifest, values, timeZone);
      for (const path of hidden) delete submitted[path];
      await onSubmit?.(submitted);
    },
  });
}
