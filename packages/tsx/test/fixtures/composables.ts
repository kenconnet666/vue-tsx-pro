import { computed, ref, toValue, type MaybeRefOrGetter, type Ref } from 'vue'

// 模拟生态里常见的组合式函数：返回 Ref
export function useStorageLike(key: string, initial: string): Ref<string> {
  return ref(localStorage.getItem(key) ?? initial)
}
export function usePointerLike() {
  return { x: ref(1), y: ref(2) }
}
// 接受 MaybeRefOrGetter：VueUse 的通行签名，getter 就能互通
export function useDoubled(source: MaybeRefOrGetter<number>) {
  return computed(() => toValue(source) * 2)
}
// 只接受可写 Ref：用 _ref(x) 交出去
export function useIncrement(target: Ref<number>) {
  return () => target.value++
}
