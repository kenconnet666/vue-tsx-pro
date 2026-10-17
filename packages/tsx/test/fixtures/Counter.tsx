import { watchEffect, onMounted } from 'vue';
import { _component } from '../../src';

export const log: string[] = [];

export const Counter = _component(({ step = 1 }: { step?: number }) => {
  let count = _state(0);
  const double = _derived(count * 2);
  const parity = _derived.by(() => {
    if (count % 2 === 0) return 'even';
    return 'odd';
  });

  // 副作用、生命周期：直接用 Vue
  watchEffect(() => log.push(`count=${count}`));
  onMounted(() => log.push('mounted'));

  return () => (
    <div>
      <span class="count">{count}</span>
      <span class="double">{double}</span>
      <span class="parity">{parity}</span>
      <button onClick={() => (count += step)}>+</button>
    </div>
  );
});
