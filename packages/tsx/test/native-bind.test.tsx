// 原生元素的 _bind：value、checked 走 v-model（多选组绑到数组）；<details> 的 open 跟着 toggle 写回；文件输入的 files 只读
import { describe, expect, it } from 'vitest';
import { createApp, nextTick, ref } from 'vue';
import { compile } from '../src/compiler';

function mount(render: () => unknown) {
  const el = document.createElement('div');
  document.body.append(el);
  createApp({ render }).mount(el);
  return el;
}

describe('原生元素的 _bind', () => {
  it('多选组：checked 绑到数组，勾选、取消时增删其中的值', async () => {
    const picked = ref<string[]>(['a']);
    const el = mount(() => (
      <>
        <input type="checkbox" value="a" _checked={picked.value} />
        <input type="checkbox" value="b" _checked={picked.value} />
      </>
    ));
    const [a, b] = el.querySelectorAll('input');
    expect([a!.checked, b!.checked]).toEqual([true, false]);
    b!.click();
    await nextTick();
    expect(picked.value).toEqual(['a', 'b']);
    a!.click();
    await nextTick();
    expect(picked.value).toEqual(['b']);
  });

  it('<details> 的 open：代码设置会展开，用户展开收起后写回', async () => {
    const open = ref(false);
    const el = mount(() => (
      <details _open={open.value}>
        <summary>标题</summary>内容
      </details>
    ));
    const details = el.querySelector('details')!;
    open.value = true;
    await nextTick();
    expect(details.open).toBe(true);
    details.open = false;
    details.dispatchEvent(new Event('toggle'));
    expect(open.value).toBe(false);
  });

  it('文件输入的 files 只读：编译成 change 时读回，不把值写到元素上', async () => {
    const code = `export const F = () => <input type="file" _files={picked.value} />;`;
    const output = (await compile(code, { filename: '/src/F.tsx', sourceMaps: false }))!.code;
    expect(output).toContain('"onChange": event => picked.value = event.currentTarget.files');
    expect(output).not.toContain('"files"');
  });

  it('写错的地方报错：open 只认 <details>；已有同名事件时不覆盖', async () => {
    const run = (code: string) => compile(code, { filename: '/src/F.tsx', sourceMaps: false });
    await expect(run(`export const F = () => <div _open={o.value} />;`)).rejects.toThrow(
      /只能写在 <details> 上/,
    );
    await expect(
      run(`export const F = () => <details _open={o.value} onToggle={() => {}} />;`),
    ).rejects.toThrow(/要占用 onToggle/);
  });
});
