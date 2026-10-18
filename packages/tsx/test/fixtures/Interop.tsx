import { watch } from 'vue';
import { _component } from '../../src';
import { Switch } from './Switch';
import { useDoubled, useIncrement, usePointerLike, useStorageLike } from './composables';
import { getSettings } from './store';

const settings = getSettings();

export const Page = _component(() => {
  let on = _state(false);
  let name = _state('a');
  let count = _state(1);

  // 接入组合式函数返回的 Ref
  let theme = _fromRef(useStorageLike('theme', 'dark'));
  const { x, y } = _fromRef(usePointerLike());

  // 交给 Vue API：getter 或 _toRef
  const doubled = _fromRef(useDoubled(() => count));
  const increment = useIncrement(_toRef(count));
  watch(
    () => on,
    (value) => (lastOn = value),
  );
  let lastOn = _state<boolean | null>(null);

  return () => (
    <div>
      <Switch checked={_bind(on)}>开关</Switch>
      <p class="on">{String(on)}</p>
      <p class="last">{String(lastOn)}</p>

      <input class="native" value={_bind(name)} />
      <p class="name">{name}</p>

      <input class="font" type="number" value={_bind.number(settings.fontSize)} />
      <p class="size">{settings.fontSize}</p>

      <p class="theme">{theme}</p>
      <button class="dark" onClick={() => (theme = theme === 'dark' ? 'light' : 'dark')}>
        切换
      </button>
      <p class="xy">
        {x},{y}
      </p>

      <p class="doubled">{doubled}</p>
      <button class="inc" onClick={increment}>
        +1
      </button>
    </div>
  );
});
