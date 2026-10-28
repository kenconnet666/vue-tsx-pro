// AuthLayout：有品牌区时分栏（品牌区在前、表单在后），没有时只有表单区；工具放在表单区里
import { describe, expect, it } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { AuthLayout } from '../AuthLayout';

describe('AuthLayout', () => {
  it('品牌区、工具和表单各在各的位置', () => {
    const host = mount(() => (
      <AuthLayout hero={<h1>联合降本</h1>} tools={<button>主题</button>}>
        <form>登录</form>
      </AuthLayout>
    ));
    const root = host.firstElementChild!;
    expect(root.children).toHaveLength(2);
    expect(root.firstElementChild!.textContent).toBe('联合降本');
    const main = root.querySelector('main')!;
    expect(main.querySelector('button')!.textContent).toBe('主题');
    expect(main.querySelector('form')).not.toBeNull();
  });

  it('不写 hero 时只有表单区，不写 tools 时没有工具区', () => {
    const host = mount(() => (
      <AuthLayout>
        <form>登录</form>
      </AuthLayout>
    ));
    const root = host.firstElementChild!;
    expect(root.children).toHaveLength(1);
    expect(root.querySelector('main')!.children).toHaveLength(1);
  });
});
