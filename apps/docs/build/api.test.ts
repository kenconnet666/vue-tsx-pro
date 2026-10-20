// @vitest-environment node
// API 提取：类型、默认值、可选值的注释、可绑定、种类
import { describe, expect, it } from 'vitest';
import { extractComponentApi } from './api';

describe('extractComponentApi', () => {
  const button = extractComponentApi('ButtonProps');
  const prop = (name: string) => button.props.find((item) => item.name === name)!;

  it('接口注释、只列组件库声明的 prop（不含原生属性与 sx）', () => {
    expect(button.description).toBe('未声明的属性落到 button 上');
    expect(button.props.map((item) => item.name)).not.toContain('sx');
    expect(button.props.map((item) => item.name)).not.toContain('onClick');
  });

  it('默认值：@default 标签优先，其次是组件参数解构里的默认值', () => {
    expect(prop('variant').default).toBe("'solid'");
    expect(prop('type').default).toBe("'button'");
    expect(prop('icon').default).toBeUndefined();
  });

  it('泛型组件的 XxxBaseProps：默认值从组件 Xxx 的参数里读', () => {
    const palette = extractComponentApi('CommandPaletteBaseProps');
    expect(palette.props.find((item) => item.name === 'hotkey')!.default).toBe("'Mod+K'");
  });

  it('档位类型展开成可选值，带每个值的注释', () => {
    const variant = prop('variant');
    expect(variant.type).toBe('keyof ButtonVariants');
    expect(variant.values!.map((value) => value.value)).toEqual([
      'solid',
      'soft',
      'surface',
      'outline',
      'ghost',
      'link',
    ]);
    expect(variant.values![0]!.description).toContain('主要操作');
    expect(prop('size').values!.map((value) => value.value)).toContain('md');
  });

  it('种类：部件属性、内容；_bindable 的 prop 标为可绑定', () => {
    expect(prop('propsIcon').kind).toBe('part');
    expect(prop('children').kind).toBe('content');
    const collapse = extractComponentApi('CollapseProps');
    expect(collapse.props.find((item) => item.name === 'open')!.bindable).toBe(true);
  });

  it('组件自己重新声明的 prop 覆盖共用选项的默认值', () => {
    const iconButton = extractComponentApi('IconButtonProps');
    expect(iconButton.props.find((item) => item.name === 'variant')!.default).toBe("'ghost'");
  });
});
