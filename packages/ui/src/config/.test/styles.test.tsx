// 组件的定制（Provider / createUi 的 components，旧的 defaults / styles）：默认值、追加样式、档位样式、内层盖过外层；
// 登记表与配方名一一对应；部件带 data-scope / data-part
import { describe, expect, it } from 'vitest';
import { Plus } from '@lucide/icons';
import { nextTick, ref } from 'vue';
import { alertRecipe } from '../../feedback/Alert';
import { avatarRecipe } from '../../display/Avatar';
import { Badge } from '../../base/Badge';
import { badgeRecipe } from '../../base/badge-styles';
import { Button } from '../../base/Button';
import { buttonRecipe } from '../../base/button-core';
import { cardRecipe } from '../../display/Card';
import { choiceRecipe } from '../../input/choice-styles';
import { inputRecipe } from '../../input/control';
import { dataTableRecipe } from '../../table/table-styles';
import { dialogRecipe } from '../../overlay/Dialog';
import { drawerRecipe } from '../../overlay/Drawer';
import { emptyRecipe } from '../../feedback/Empty';
import { indicatorRecipe } from '../../base/Indicator';
import { linkRecipe } from '../../base/Link';
import { progressRecipe } from '../../feedback/Progress';
import { resultRecipe } from '../../feedback/Result';
import { tableRecipe } from '../../table/Table';
import { tabsRecipe } from '../../navigation/Tabs';
import type { ComponentName } from '../components';
import { Tab, TabList, Tabs } from '../../navigation/Tabs';
import { mount, styleOf } from '../../utils/.test/mount';
import { Provider } from '../Provider';

describe('components', () => {
  it('登记表的每个组件都有同名的配方', () => {
    // satisfies：登记了却没有配方、有配方却没登记，类型检查都会报
    const recipes = {
      Button: buttonRecipe,
      Badge: badgeRecipe,
      Alert: alertRecipe,
      Tabs: tabsRecipe,
      Link: linkRecipe,
      Indicator: indicatorRecipe,
      Avatar: avatarRecipe,
      Card: cardRecipe,
      Progress: progressRecipe,
      Empty: emptyRecipe,
      Result: resultRecipe,
      Dialog: dialogRecipe,
      Drawer: drawerRecipe,
      Input: inputRecipe,
      Choice: choiceRecipe,
      DataTable: dataTableRecipe,
      Table: tableRecipe,
    } satisfies Record<ComponentName, { readonly name: string | undefined }>;
    for (const [name, recipe] of Object.entries(recipes)) expect(recipe.name).toBe(name);
  });

  it('一个组件的默认值、追加的样式、档位的样式写在一处；内层 Provider 盖过外层', () => {
    const host = mount(() => (
      <Provider
        components={{
          Button: {
            defaults: { variant: 'outline' },
            styles: { root: { letterSpacing: '1px' } },
            variants: { variant: { outline: { root: { borderStyle: 'dashed' } } } },
          },
        }}
      >
        <Button>外层</Button>
        <Provider components={{ Button: { styles: { root: { letterSpacing: '3px' } } } }}>
          <Button>内层</Button>
        </Provider>
      </Provider>
    ));
    const [outer, inner] = host.querySelectorAll('button');
    expect(styleOf(outer!).get('&|letter-spacing')).toBe('1px');
    expect(styleOf(outer!).get('&|border-top-style')).toBe('dashed');
    expect(styleOf(inner!).get('&|letter-spacing')).toBe('3px');
    expect(styleOf(inner!).get('&|border-top-style')).toBe('dashed');
  });
});

describe('组件的主题定制', () => {
  it('Provider 的 components 里的 styles 追加在组件自己的样式之后；内层排在外层之后', () => {
    const host = mount(() => (
      <Provider
        components={{ Button: { styles: { root: { letterSpacing: '1px', fontStyle: 'italic' } } } }}
      >
        <Button>外层</Button>
        <Provider components={{ Button: { styles: { root: { letterSpacing: '3px' } } } }}>
          <Button>内层</Button>
        </Provider>
      </Provider>
    ));
    const [outer, inner] = host.querySelectorAll('button');
    expect(styleOf(outer!).get('&|letter-spacing')).toBe('1px');
    expect(styleOf(inner!).get('&|letter-spacing')).toBe('3px');
    expect(styleOf(inner!).get('&|font-style')).toBe('italic');
  });

  it('新增的档位取值：扩展了档位接口后在 components 的 variants 里给样式', () => {
    // 使用方会扩展 ButtonVariants 接口；测试里不扩展（会漏到整个包的类型里），直接断言
    const variant = 'brand' as never;
    const host = mount(() => (
      <Provider
        components={{
          Button: {
            variants: { variant: { brand: { root: { color: 'rgb(1, 2, 3)' } } } } as never,
          },
        }}
      >
        <Button variant={variant}>品牌</Button>
      </Provider>
    ));
    expect(styleOf(host.querySelector('button')!).get('&|color')).toBe('rgb(1, 2, 3)');
  });

  it('档位与 Provider 的 components 变了，样式跟着变（配方按实例记住上一次的结果）', async () => {
    const variant = ref<'solid' | 'link'>('solid');
    const spacing = ref('1px');
    const host = mount(() => (
      <Provider components={{ Button: { styles: { root: { letterSpacing: spacing.value } } } }}>
        <Button variant={variant.value}>按钮</Button>
      </Provider>
    ));
    const button = host.querySelector('button')!;
    const solid = button.className;
    variant.value = 'link';
    await nextTick();
    expect(button.className).not.toBe(solid);
    expect(styleOf(button).get('&|letter-spacing')).toBe('1px');
    variant.value = 'solid';
    await nextTick();
    expect(button.className).toBe(solid);
    spacing.value = '3px';
    await nextTick();
    expect(styleOf(button).get('&|letter-spacing')).toBe('3px');
  });

  it('部件带 data-scope / data-part', () => {
    const host = mount(() => (
      <>
        <Button icon={Plus} loading>
          按钮
        </Button>
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
    // 按钮的每个内部节点都是部件：内容层、图标、加载指示（主题定制按部件改得到）
    expect(host.querySelector('button [data-scope="button"][data-part="content"]')).not.toBeNull();
    expect(host.querySelector('button svg[data-scope="button"][data-part="icon"]')).not.toBeNull();
    expect(host.querySelector('button [data-scope="button"][data-part="spinner"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="badge"][data-part="root"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="badge"][data-part="dot"]')).not.toBeNull();
    expect(host.querySelector('[role="tab"][data-scope="tabs"][data-part="root"]')).not.toBeNull();
    expect(host.querySelector('[data-scope="tabs"][data-part="close"]')).not.toBeNull();
  });
});
