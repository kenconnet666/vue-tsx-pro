// 持有 Ref 时的 Vue 原生行为：不是 bug，但设计约定必须写明
import { it, expect } from 'vitest';
import { reactive, ref, shallowReactive, shallowRef } from 'vue';

it('ref() / shallowRef() 传入 Ref 时原样返回同一个 Ref', () => {
  const a = ref(false);
  expect(ref(a)).toBe(a);
  expect(shallowRef(a)).toBe(a);
});

it('reactive 对象里的 Ref 会被自动解包，读出来已不是 Ref', () => {
  const state = reactive({ on: ref(false) });
  expect(typeof state.on).toBe('boolean');
});

it('普通对象与 shallowReactive 容器保持 Ref 身份', () => {
  const on = ref(false);
  expect({ on }.on).toBe(on);
  expect(shallowReactive({ on }).on).toBe(on);
});
