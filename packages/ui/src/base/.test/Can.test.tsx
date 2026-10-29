// Can、useCan：有权限才渲染；数组任一满足即可；没接入权限判断时一律放行；权限变了界面跟着变
import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { Provider } from '../../config/Provider';
import { mount } from '../../utils/.test/mount';
import { Can } from '../Can';

describe('Can', () => {
  it('有权限渲染内容，没有时渲染 fallback', () => {
    const host = mount(() => (
      <Provider permissions={(permission) => permission === 'cost:add'}>
        <Can permission="cost:add">
          <button>新建</button>
        </Can>
        <Can permission="cost:remove" fallback={<span>只读</span>}>
          <button>删除</button>
        </Can>
        <Can permission="cost:remove">
          <button>也删除</button>
        </Can>
      </Provider>
    ));
    expect([...host.querySelectorAll('button')].map((button) => button.textContent)).toEqual([
      '新建',
    ]);
    expect(host.textContent).toContain('只读');
  });

  it('给数组时有其中任意一个就算有', () => {
    const host = mount(() => (
      <Provider permissions={(permission) => permission === 'cost:edit'}>
        <Can permission={['cost:add', 'cost:edit']}>
          <button>编辑</button>
        </Can>
        <Can permission={['cost:add', 'cost:remove']}>
          <button>不该出现</button>
        </Can>
      </Provider>
    ));
    expect([...host.querySelectorAll('button')].map((button) => button.textContent)).toEqual([
      '编辑',
    ]);
  });

  it('没接入权限判断时一律放行', () => {
    const host = mount(() => (
      <Can permission="anything">
        <button>放行</button>
      </Can>
    ));
    expect(host.querySelector('button')!.textContent).toBe('放行');
  });

  it('权限变了界面跟着变', async () => {
    const granted = ref(['cost:add']);
    const host = mount(() => (
      <Provider permissions={(permission) => granted.value.includes(permission)}>
        <Can permission="cost:remove">
          <button>删除</button>
        </Can>
      </Provider>
    ));
    expect(host.querySelector('button')).toBeNull();
    granted.value = ['cost:add', 'cost:remove'];
    await nextTick();
    expect(host.querySelector('button')!.textContent).toBe('删除');
  });
});
