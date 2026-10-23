// 组件演练场：每个列出的组件都能渲染出来；生成的代码只写和默认值不同的属性
import { expect, it } from 'vitest';
import { nextTick } from 'vue';
import { mount } from '../../../test/mount';
import { componentCode } from '../code';
import { controlOf, parseDefault } from '../controls';
import { playableNames, PropsPlayground } from '../PropsPlayground';

it('列出了大部分组件，内部部件不在其中', () => {
  expect(playableNames.size).toBeGreaterThan(80);
  for (const name of ['Button', 'Select', 'Tabs', 'Dialog', 'Steps', 'ButtonGroup']) {
    expect(playableNames).toContain(name);
  }
  for (const name of ['ModalCore', 'ToastItem', 'DataTableRow']) {
    expect(playableNames).not.toContain(name);
  }
});

it.each([...playableNames])('%s：预览渲染不出错', async (name) => {
  const root = mount(() => <PropsPlayground component={name} />);
  await nextTick();
  expect(root.textContent).not.toContain('预览出错');
  // 生成的代码里有这个组件（预览里也可能有 code 元素，按文字找）
  expect(root.textContent).toContain(`<${name}`);
});

it('默认值的源码转成值', () => {
  expect([parseDefault("'solid'"), parseDefault('false'), parseDefault('0.5')]).toEqual([
    'solid',
    false,
    0.5,
  ]);
  expect(parseDefault('defaultLabel()')).toBeUndefined();
});

it('生成的代码：和默认值相同的不写，图标写导入名', () => {
  const prop = (name: string, type: string, values?: string[]) => ({
    name,
    kind: 'prop' as const,
    type,
    required: false,
    description: '',
    values: values?.map((value) => ({ value, description: '' })),
  });
  const controls = [
    prop('variant', 'keyof ButtonVariants', ['solid', 'soft']),
    prop('disabled', 'boolean'),
    prop('icon', 'IconData'),
  ].map((item) => controlOf(item)!);
  const code = componentCode({
    name: 'Button',
    entry: '@vue-tsx-pro/ui',
    controls,
    values: { variant: 'solid', disabled: true, icon: 'Plus' },
    defaults: { variant: 'solid', disabled: false },
    children: '保存',
  });
  expect(code).toContain("import { Plus } from '@lucide/icons';");
  expect(code).toContain('<Button disabled icon={Plus}>保存</Button>');
});

it('子路径的组件从它的入口导入，内容里用到的主入口组件另写一行', () => {
  const code = componentCode({
    name: 'FilterBar',
    entry: '@vue-tsx-pro/ui/patterns',
    controls: [],
    values: {},
    defaults: {},
    children: '<Button>新建</Button>',
    imports: ['Button'],
  });
  expect(code).toContain("import { Button } from '@vue-tsx-pro/ui';");
  expect(code).toContain("import { FilterBar } from '@vue-tsx-pro/ui/patterns';");
});
