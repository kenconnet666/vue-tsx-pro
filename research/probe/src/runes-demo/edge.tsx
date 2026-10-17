import { component } from '../component'

const Foo = component(() => () => <i>foo</i>)
const Bar = component(() => () => <b>bar</b>)

/** 各种读写形态，返回结果给测试断言 */
export function edgeCases() {
  let a = _state(1)
  let b = _state(2)
  ;[a, b] = [b, a] // 解构赋值交换

  const shorthand = { a } // 对象简写

  let last = _state(0)
  for (last of [5, 6]) { /* for-of 目标 */ }

  let s = _state<string | null>(null)
  s ??= 'x'
  s &&= s + '!'

  let n = _state(1)
  n += 2
  n **= 2
  const post = n++
  const pre = ++n

  function shadow(a: number) { return a + 100 } // 同名参数遮蔽，不应改写
  const typed: typeof a = a // 类型位置不改写

  let View = _state.raw(Foo)
  const render = () => <View />
  View = Bar

  return { a, b, shorthand, last, s, n, post, pre, shadow: shadow(1), typed, render }
}
