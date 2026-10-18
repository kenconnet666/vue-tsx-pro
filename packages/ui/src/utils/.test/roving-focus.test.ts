// 漫游焦点：Tab 进入点、方向键移动、跳过不可用项、选中项变化时更新
import { afterEach, describe, expect, it } from 'vitest';
import { rovingFocus, type RovingFocusOptions } from '../roving-focus';

const cleanups: (() => void)[] = [];
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  document.body.innerHTML = '';
});

function group(html: string, options: Partial<RovingFocusOptions> = {}) {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  cleanups.push(rovingFocus(container, { items: 'button', ...options }));
  const buttons = [...container.querySelectorAll('button')];
  const press = (key: string) =>
    document.activeElement!.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    );
  const tabStops = () =>
    buttons.filter((b) => b.getAttribute('tabindex') === '0').map((b) => b.textContent);
  return { container, buttons, press, tabStops };
}

describe('rovingFocus', () => {
  it('只有一个 Tab 进入点：默认第一项；有 aria-selected 的项优先', () => {
    expect(group('<button>a</button><button>b</button>').tabStops()).toEqual(['a']);
    expect(group('<button>a</button><button aria-selected="true">b</button>').tabStops()).toEqual([
      'b',
    ]);
  });

  it('方向键移动并循环，Home/End 到两端，跳过不可用项；聚焦的项成为新的进入点', () => {
    const { buttons, press, tabStops } = group(
      '<button>a</button><button disabled>x</button><button>b</button><button>c</button>',
    );
    buttons[0]!.focus();
    press('ArrowRight');
    expect(document.activeElement).toBe(buttons[2]);
    expect(tabStops()).toEqual(['b']);
    press('End');
    expect(document.activeElement).toBe(buttons[3]);
    press('ArrowRight');
    expect(document.activeElement).toBe(buttons[0]);
    press('ArrowLeft');
    expect(document.activeElement).toBe(buttons[3]);
    press('Home');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('loop: false 时停在两端；纵向只认上下键', () => {
    const { buttons, press } = group('<button>a</button><button>b</button>', {
      loop: false,
      orientation: 'vertical',
    });
    buttons[1]!.focus();
    press('ArrowDown');
    expect(document.activeElement).toBe(buttons[1]);
    press('ArrowRight');
    expect(document.activeElement).toBe(buttons[1]);
    press('ArrowUp');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('从右到左排版时左右键反过来', () => {
    const { container, buttons, press } = group('<button>a</button><button>b</button>');
    container.dir = 'rtl';
    container.style.direction = 'rtl';
    buttons[0]!.focus();
    press('ArrowLeft');
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('选中项变化（aria-selected）、项增删时重新定进入点', async () => {
    const { container, buttons, tabStops } = group('<button>a</button><button>b</button>');
    buttons[1]!.setAttribute('aria-selected', 'true');
    await new Promise((resolve) => setTimeout(resolve));
    expect(tabStops()).toEqual(['b']);
    const added = document.createElement('button');
    container.prepend(added);
    await new Promise((resolve) => setTimeout(resolve));
    expect(added.getAttribute('tabindex')).toBe('-1');
  });
});
