// 控件状态与主题 token 在真实浏览器里的计算样式：不可用、只读的选择框指针；细线跟随 borderWidths
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  ColorField,
  defineTheme,
  lightTheme,
  Provider,
  Select,
  Splitter,
  TreeSelect,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, type App } from 'vue';

const cities = ['北京', '上海'];
interface Org {
  id: string;
  name: string;
  children?: Org[];
}
const orgs: Org[] = [{ id: 'hq', name: '总部', children: [{ id: 'sales', name: '销售部' }] }];
// 把细线加粗：用到 borderWidths 的细线都应跟着变
const thickTheme = defineTheme(lightTheme, { borderWidths: { xs: '3px' } });

const Page = _component(() => () => (
  <>
    <Select items={cities} aria-label="可用" propsRoot={{ class: 'select-enabled' }} />
    <Select items={cities} aria-label="不可用" disabled propsRoot={{ class: 'select-disabled' }} />
    <Select items={cities} aria-label="只读" readonly propsRoot={{ class: 'select-readonly' }} />
    <TreeSelect
      items={orgs}
      getKey={(org) => org.id}
      getLabel={(org) => org.name}
      getChildren={(org) => org.children}
      aria-label="部门"
      disabled
      propsRoot={{ class: 'tree-select-disabled' }}
    />
    <ColorField aria-label="颜色" disabled propsRoot={{ class: 'color-disabled' }} />
    <Provider theme={thickTheme}>
      <Splitter class="splitter" style="height: 10rem" start={<div>上</div>} end={<div>下</div>} />
    </Provider>
  </>
));

let app: App;
let root: HTMLElement;

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  app = createApp(Page);
  app.mount(root);
});
afterEach(() => {
  app.unmount();
  root.remove();
});

const cursorOf = (selector: string) => getComputedStyle(root.querySelector(selector)!).cursor;

describe('选择框外壳的指针', () => {
  it('可用时手形，不可用时 not-allowed（与其他输入框一致），只读时普通箭头', () => {
    expect(cursorOf('.select-enabled')).toBe('pointer');
    expect(cursorOf('.select-disabled')).toBe('not-allowed');
    expect(cursorOf('.select-disabled button')).toBe('not-allowed');
    expect(cursorOf('.select-readonly')).toBe('default');
    expect(cursorOf('.tree-select-disabled')).toBe('not-allowed');
  });

  it('ColorField 不可用时色块不是手形', () => {
    // 色块是打开取色器的按钮（ButtonBase），不可用时随按钮是 not-allowed
    expect(cursorOf('.color-disabled button')).toBe('not-allowed');
  });
});

describe('细线跟随 borderWidths', () => {
  it('Splitter 的分隔线取 borderWidths.xs 的宽度并居中', () => {
    const handle = root.querySelector<HTMLElement>('.splitter [role="separator"]')!;
    const line = handle.querySelector('span')!.getBoundingClientRect();
    const box = handle.getBoundingClientRect();
    expect(line.width).toBeCloseTo(3, 0);
    expect(line.left + line.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
  });
});
