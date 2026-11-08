/**
 * 收单据的值：按清单与字段权限合并、查值（引擎存普通 JSON，查的时候读成强类型），不合格时报 invalid-input。
 * 发起、处理、改单据数据、动作里的暂存共用。
 */
import {
  mergeSubmission,
  typedValue,
  type FieldState,
  type FieldTypeChecks,
  type FormManifest,
} from '@zerodep-dev/flow-ts-model';
import { FlowError } from '../core/errors.ts';

/** 候选匹配这个人 */
/**
 * 收提交（mergeSubmission）：引擎存的是普通 JSON（小数、日期是文字），清单的值检查要强类型（json-wire 还原的 Decimal、日期），
 * 所以按 typedValue 读成强类型再查；取的值仍是原样的 JSON
 */
export function submit(
  manifest: FormManifest,
  states: ReadonlyMap<string, FieldState>,
  stored: Readonly<Record<string, unknown>>,
  submitted: Readonly<Record<string, unknown>>,
  fieldTypes: FieldTypeChecks | undefined,
) {
  const typed = (row: Readonly<Record<string, unknown>>) =>
    Object.fromEntries(
      Object.entries(row).map(([name, value]) => [
        name,
        manifest[name] ? typedValue(manifest[name], value) : value,
      ]),
    );
  const { errors } = mergeSubmission(manifest, states, typed(stored), typed(submitted), fieldTypes);
  const { values } = mergeSubmission(manifest, states, stored, submitted);
  return { values, errors };
}

/** 单据的值不合格：报 invalid-input，details.errors 是全部问题，消息说第一处 */
export function throwFormErrors(
  manifest: FormManifest,
  errors: readonly { readonly field: string; readonly code: string }[],
): void {
  const [first] = errors;
  if (!first) return;
  const label = manifest[first.field.split(/[.[]/)[0]!]?.label ?? first.field;
  throw new FlowError(
    'invalid-input',
    first.code === 'required' ? `“${label}”要填` : `“${label}”的值不对`,
    { field: first.field, code: first.code, errors },
  );
}
