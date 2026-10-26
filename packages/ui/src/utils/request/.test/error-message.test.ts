// 错误的文案：按码从语言包取、参数填进去、没有文案时的兜底；语言包覆盖请求层与 query 的全部码
import { describe, expect, it } from 'vitest';
import { defineLang } from '../../../config/lang/lang';
import { enUS } from '../../../config/lang/en-US';
import { zhCN } from '../../../config/lang/zh-CN';
import { errorCodeOf, errorCodeText, errorMessage } from '../error-message';
import { HTTP_ERROR_CODES, HttpError } from '../http';

/** query 的码：与 query 仓库 spec/error-codes.json 一致（两个仓库不共用文件，改了那边要同步这里） */
const QUERY_CODES = [
  'query.request-invalid',
  'query.empty-result',
  'query.too-many-rows',
  'query.unexpected-row-count',
  'query.statement-timeout',
  'query.execution-failed',
  'query.invalid-row',
  'query.batch-write-failed',
  'query.transaction-closed',
  'query.quota-exceeded',
];

const httpError = (code: string, params?: Record<string, unknown>, message = code) =>
  new HttpError(message, { code, params, request: { url: '/x' } });

describe('错误的文案', () => {
  it('自带的语言包覆盖请求层与 query 的全部码', () => {
    for (const lang of [zhCN, enUS]) {
      expect(Object.keys(lang.errorCodes).sort()).toEqual(
        [...HTTP_ERROR_CODES, ...QUERY_CODES].sort(),
      );
    }
  });

  it('认得 HttpError、取消、带 包.码 的别的错误；系统码不算', () => {
    expect(errorCodeOf(httpError('flow.forbidden'))).toBe('flow.forbidden');
    expect(errorCodeOf(new DOMException('aborted', 'AbortError'))).toBe('http.aborted');
    expect(errorCodeOf(Object.assign(new Error('quota'), { code: 'query.quota-exceeded' }))).toBe(
      'query.quota-exceeded',
    );
    expect(errorCodeOf(Object.assign(new Error('missing'), { code: 'ENOENT' }))).toBeUndefined();
    expect(errorCodeOf('boom')).toBeUndefined();
  });

  it('按码取文案并填参数；没有文案时用错误的 message，再没有用 requestFailed', () => {
    expect(errorMessage(httpError('http.status', { status: 502 }), zhCN)).toBe(
      '服务暂时不可用（502），请稍后重试',
    );
    expect(errorMessage(httpError('flow.not-candidate', {}, '不是候选人'), zhCN)).toBe(
      '不是候选人',
    );
    expect(errorMessage(new Error(''), zhCN)).toBe(zhCN.requestFailed);
    expect(errorCodeText(new Error('Failed to fetch'), zhCN)).toBeUndefined();
  });

  it('defineLang 合并 errorCodes：应用补自己命名空间的码，自带的还在', () => {
    const lang = defineLang(zhCN, {
      errorCodes: { 'flow.forbidden': ({ action }) => `没有权限：${String(action)}` },
    });
    expect(errorMessage(httpError('flow.forbidden', { action: '认领' }), lang)).toBe(
      '没有权限：认领',
    );
    expect(errorMessage(httpError('http.network'), lang)).toBe(zhCN.errorCodes['http.network']);
  });
});
