// 组件的主题定制（Provider / createUi 的 styles）：追加样式、新增档位、内层盖过外层；部件带 data-scope / data-part
import { describe, expect, it } from 'vitest';
import { Badge } from '../../base/Badge';
import { Button } from '../../base/Button';
import { Tab, TabList, Tabs } from '../../navigation/Tabs';
import { mount, styleOf } from '../../utils/.test/mount';
import { Provider } from '../Provider';

describe('组件的主题定制', () => {
  it('Provider 的 styles 追加在组件自己的样式之后；内层排在外层之后', () => {
    const host = mount(() => (
      <Provider
        styles={{ Button: { base: { root: { letterSpacing: '1px', fontStyle: 'italic' } } } }}
      >
        <Button>外层</Button>
        <Provider styles={{ Button: { base: { root: { letterSpacing: '3px' } } } }}>
          <Button>内层</Button>
        </Provider>
      </Provider>
    ));
    const [outer, inner] = host.querySelectorAll('button');
    expect(styleOf(outer!).get('&|letter-spacing')).toBe('1px');
    expect(styleOf(inner!).get('&|letter-spacing')).toBe('3px');
    expect(styleOf(inner!).get('&|font-style')).toBe('italic');
  });

  it('新增的档位取值：扩展了档位接口后在 styles 里给样式', () => {
    // 使用方会扩展 ButtonVariants 接口；测试里不扩展（会漏到整个包的类型里），直接断言
    const variant = 'brand' as never;
    const host = mount(() => (
      <Provider
        styles={{
          Button: { variants: { variant: { brand: { root: { color: 'rgb(1, 2, 3)' } } } } },
        }}
      >
        <Button variant={variant}>品牌</Button>
      </Provider>
    ));
    expect(styleOf(host.querySelector('button')!).get('&|color')).toBe('rgb(1, 2, 3)');
  });

  it('部件带 data-scope / data-part', () => {
    const host = mount(() => (
      <>
        <Button>按钮</Button>
        <Badge dot>标记</Badge>
        <Tabs _value="a">
          <TabList aria-label="标签">
            <Tab value="a" onClose={() => {}}>
              A
            </Tab>
          </TabList>
        </Tabs>
      </>
    ));
    expect(host.querySelector('button[data-scope="button"][data-part="root"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="badge"][data-part="root"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="badge"][data-part="dot"]')).not.toBeNull();
    expect(host.querySelector('[role="tab"][data-scope="tab"][data-part="root"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="tab"][data-part="close"]')).not.toBeNull();
  });
});
