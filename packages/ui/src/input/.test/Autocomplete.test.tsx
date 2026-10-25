// Autocomplete：值就是文字；选一项建议填入它的文字；没有可选的建议时不弹出；写了 name 时提交的是文字；没有展开按钮
import { beforeAll, describe, expect, it } from 'vitest';
import { nextTick, reactive } from 'vue';
import { mount } from '../../utils/.test/mount';
import { Autocomplete } from '../Autocomplete';

// happy-dom 没有 popover 的方法
beforeAll(() => {
  const proto = HTMLElement.prototype as unknown as Record<string, unknown>;
  proto.showPopover ??= () => {};
  proto.hidePopover ??= () => {};
});

const flush = async () => {
  for (let i = 0; i < 4; i++) await nextTick();
};

const domains = ['qq.com', '163.com', 'gmail.com'];

function render() {
  const state = reactive({ email: '' });
  const root = mount(() => (
    <form>
      <Autocomplete
        _value={_bind(state.email)}
        // 建议随输入算出：@ 前的部分接上常用后缀
        items={state.email ? domains.map((domain) => `${state.email.split('@')[0]}@${domain}`) : []}
        filter={(item: string, text) => item.startsWith(text)}
        name="email"
        aria-label="邮箱"
      />
    </form>
  ));
  const input = root.querySelector<HTMLInputElement>('input[role="combobox"]')!;
  const type = async (text: string) => {
    input.focus();
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();
  };
  return { root, state, input, type };
}

describe('Autocomplete', () => {
  it('输入就是值；有建议时展开，选一项填入它的文字；没有展开按钮', async () => {
    const { root, state, input, type } = render();
    expect(root.querySelector('button')).toBeNull();
    await type('lin');
    expect(state.email).toBe('lin');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    const options = [...root.querySelectorAll('[role="option"]')];
    expect(options.map((option) => option.textContent)).toEqual([
      'lin@qq.com',
      'lin@163.com',
      'lin@gmail.com',
    ]);
    (options[1] as HTMLElement).click();
    await flush();
    expect(state.email).toBe('lin@163.com');
  });

  it('没有可选的建议时不弹出（不显示“没有匹配”）；表单提交的是文字', async () => {
    const { root, input, type } = render();
    await type('lin@x');
    expect(input.getAttribute('aria-expanded')).toBe('false');
    await type('自定义的文字');
    expect(new FormData(root.querySelector('form')!).get('email')).toBe('自定义的文字');
  });
});
