// 示例分两列（代码里写定）：每列前两个示例的卡片立即渲染，靠后的先占位、首帧之后补上；标题一开始就在（目录、锚点照常）
import { _component } from '@vue-tsx-pro/tsx';
import { expect, it, vi } from 'vitest';
import { Example } from '../site/Example';
import { ExampleColumn, Examples } from '../site/Examples';
import type { Demo } from '../site/types';
import { mount } from './mount';

const demo = (name: string): Demo => ({
  component: _component(() => () => <p class="demo">{name}</p>),
  source: `<p>${name}</p>`,
  path: `test/${name}`,
});

it('每列前两个立即渲染，其余首帧之后补上；标题一开始就都在', async () => {
  const host = mount(
    _component(() => () => (
      <Examples>
        <ExampleColumn>
          {['a', 'b', 'c'].map((name) => (
            <Example key={name} id={name} title={name} demo={demo(name)} />
          ))}
        </ExampleColumn>
        <ExampleColumn>
          {['d', 'e', 'f'].map((name) => (
            <Example key={name} id={name} title={name} demo={demo(name)} />
          ))}
        </ExampleColumn>
      </Examples>
    )),
  );
  const rendered = () => [...host.querySelectorAll('.demo')].map((element) => element.textContent);
  expect([...host.querySelectorAll('h2[id]')].map((heading) => heading.id)).toEqual([
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
  ]);
  expect(rendered()).toEqual(['a', 'b', 'd', 'e']);
  await vi.waitFor(() => expect(rendered()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']));
});
