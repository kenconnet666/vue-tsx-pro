/**
 * 错误的文案：按业务错误码（flow 仓库 docs/decisions/0008）从语言包的 errorCodes 取，组件显示请求失败时都经过这里。
 * 码的来源：HttpError 的 code（后端回的 `flow.`、`query.`、应用自己的，或请求层的 `http.`）；取消是 `http.aborted`；
 * 别的包的错误带 `包.码` 写法的 code 字段也认（query 的本地库 `query.quota-exceeded`、flow 的 FlowError）。
 *
 *   const describe = useErrorMessage();
 *   describe(error);                        // → '数据已被他人修改或删除，请刷新后重试'
 *
 * 应用与 flow-ui 补自己命名空间的文案：`defineLang(zhCN, { errorCodes: { 'app.quota': '额度不足' } })`（与自带的合并）。
 */
import { useLang } from '../../config/context';
import type { Lang } from '../../config/lang/lang';
import { HttpError, isAbortError } from './http';

/** 错误上的业务错误码；认不出时为 undefined */
export function errorCodeOf(error: unknown): string | undefined {
  if (error instanceof HttpError) return error.code;
  if (isAbortError(error)) return 'http.aborted';
  const code =
    typeof error === 'object' && error !== null ? (error as { code?: unknown }).code : undefined;
  // 只认 `包.码` 的写法：Node 的 ENOENT、DOMException 的数字 code 不算
  return typeof code === 'string' && code.includes('.') ? code : undefined;
}

/**
 * 给人看的错误文案：码在 lang.errorCodes 里有文案时用它（params 填进去）；没有时用错误自己的 message（后端给的兜底、
 * 应用的上传函数抛的说明），再没有用 lang.requestFailed
 */
export function errorMessage(error: unknown, lang: Lang): string {
  return (
    errorCodeText(error, lang) ??
    (error instanceof Error && error.message ? error.message : lang.requestFailed)
  );
}

/**
 * 只按码取的文案；错误没有码、码没有文案时为 undefined。组件有自己的笼统提示时用它
 * （远程选项：`errorCodeText(error, lang) ?? lang.listLoadFailed`），不把底层的英文说明露给用户
 */
export function errorCodeText(error: unknown, lang: Lang): string | undefined {
  const code = errorCodeOf(error);
  if (code === undefined) return undefined;
  return codeText(code, (error as { params?: Readonly<Record<string, unknown>> }).params, lang);
}

/** 一个码的文案（也用于 errors 明细里按字段的码）；语言包里没有时为 undefined */
export function codeText(
  code: string,
  params: Readonly<Record<string, unknown>> | undefined,
  lang: Lang,
): string | undefined {
  const text = lang.errorCodes[code];
  return typeof text === 'function' ? text(params ?? {}) : text;
}

/** 当前语言下的 errorMessage（在 setup 里调用）；返回的函数随 Provider 切换语言 */
export function useErrorMessage(): (error: unknown) => string {
  const lang = useLang();
  return (error) => errorMessage(error, lang);
}
