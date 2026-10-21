// @vitest-environment node
// API 提取：类型、默认值、可选值的注释、可绑定、种类
import { describe, expect, it } from 'vitest';
import { extractComponentApi } from './api';

describe('extractComponentApi', () => {
  const button = extractComponentApi('ButtonProps');
  const prop = (name: string) => button.props.find((item) => item.name === name)!;

  it('说明取组件自己的注释（不是接口的“未声明的属性落到…上”）、只列组件库声明的 prop（不含原生属性与 sx）', () => {
    expect(button.description).toBe('按钮（button）：样式、色调、尺寸、圆角、图标、加载中、波纹');
    expect(button.props.map((item) => item.name)).not.toContain('sx');
    expect(button.props.map((item) => item.name)).not.toContain('onClick');
  });

  it('默认值：@default 标签优先，其次是组件参数解构里的默认值', () => {
    expect(prop('variant').default).toBe("'solid'");
    expect(prop('type').default).toBe("'button'");
    expect(prop('icon').default).toBeUndefined();
  });

  it('默认值里的类型断言不显示（_bindable(0 as V) 显示 0）', () => {
    const slider = extractComponentApi('SliderProps');
    expect(slider.props.find((item) => item.name === 'value')!.default).toBe('0');
  });

  it('泛型组件的 XxxBaseProps：默认值从组件 Xxx 的参数里读', () => {
    const palette = extractComponentApi('CommandPaletteBaseProps');
    expect(palette.component).toBe('CommandPalette');
    expect(palette.props.find((item) => item.name === 'hotkey')!.default).toBe("'Mod+K'");
  });

  it('组件本身叫 XxxBase 时不去掉 Base', () => {
    const base = extractComponentApi('ButtonBaseProps');
    expect(base.component).toBe('ButtonBase');
    expect(base.props.find((item) => item.name === 'type')!.default).toBe("'button'");
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
