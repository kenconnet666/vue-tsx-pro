// 浏览器里编译：导入导出改写成读写模块表、执行编译结果；与 Worker 里跑的是同一个编译函数
import { describe, expect, it } from 'vitest';
import { compileInThread, evaluateModule, importedModules } from '../src/browser-compile/index.ts';

describe('compileModule', () => {
  it('import 改成从模块表取，具名导出、默认导出都写进导出对象', async () => {
    const code = await compileInThread(`import { double } from 'math';
import * as all from 'math';
import 'side-effect-only';
export const fields = { title: { label: '标题', type: 'text' } };
export function triple(n: number) { return n * 3; }
const answer = double(21);
export { answer as result };
export default function Form() { return all.double(1); }`);
    expect(code).not.toMatch(/^\s*(import|export) /m);
    expect(importedModules(code)).toEqual(['math']);
    const exports = evaluateModule(code, { math: { double: (n: number) => n * 2 } });
    expect(exports.fields).toEqual({ title: { label: '标题', type: 'text' } });
    expect((exports.triple as (n: number) => number)(2)).toBe(6);
    expect(exports.result).toBe(42);
    expect((exports.default as () => number)()).toBe(2);
  });

  it('默认导出是表达式、匿名函数时照样交出去', async () => {
    const arrow = evaluateModule(await compileInThread('export default (n: number) => n + 1;'), {});
    expect((arrow.default as (n: number) => number)(1)).toBe(2);
    const anonymous = evaluateModule(
      await compileInThread('export default function () { return 7; }'),
      {},
    );
    expect((anonymous.default as () => number)()).toBe(7);
  });

  it('语法写错时报带文件名与位置的错误；从别的模块再导出报错', async () => {
    await expect(
      compileInThread('export default () => (<div>', { filename: 'Form.tsx' }),
    ).rejects.toThrow(/Form\.tsx: .*\(1:\d+\)/);
    await expect(compileInThread("export { a } from 'x';")).rejects.toThrow(/re-exporting/);
  });
});

describe('evaluateModule', () => {
  it('导入了模块表里没有的模块时报错，指出是哪个', async () => {
    const code = await compileInThread("import { ref } from 'vue';\nexport default ref;");
    expect(() => evaluateModule(code, {})).toThrow(/imports vue/);
  });
});
