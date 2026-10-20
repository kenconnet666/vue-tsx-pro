// IconButton：名称、图标部件属性；与 LinkButton 共用的按钮行为
import { Settings } from '@lucide/icons';
import { describe, expect, it, vi } from 'vitest';
import { mount } from '../../utils/.test/mount';
import { IconButton } from '../IconButton';
import { LinkButton } from '../LinkButton';

const first = <T extends Element>(root: Element, selector: string) =>
  root.querySelector<T>(selector)!;

describe('IconButton', () => {
  it('IconButton：名称来自 aria-label，图标部件属性可覆盖', () => {
    const root = mount(() => (
      <IconButton icon={Settings} aria-label="设置" propsIcon={{ class: 'gear' }} />
    ));
    const button = first(root, 'button');
    expect(button.getAttribute('aria-label')).toBe('设置');
    expect(button.querySelector('svg.gear')).not.toBeNull();
  });

  it('三种按钮共用一套行为：加载中、可聚焦的不可用都拦下点击，状态写成 data 属性', () => {
    const onClick = vi.fn();
    const root = mount(() => (
      <>
        <IconButton icon={Settings} aria-label="加载" loading onClick={onClick} />
        <IconButton
          icon={Settings}
          aria-label="不可用"
          disabled
          focusableWhenDisabled
          onClick={onClick}
        />
        <LinkButton href="/x" loading onClick={onClick}>
          链接
        </LinkButton>
      </>
    ));
    const [loading, soft] = root.querySelectorAll('button');
    const link = first<HTMLAnchorElement>(root, 'a');
    for (const element of [loading!, soft!, link]) element.click();
    expect(onClick).not.toHaveBeenCalled();
    expect([loading!.dataset.loading, loading!.getAttribute('aria-busy')]).toEqual([
      'true',
      'true',
    ]);
    expect([soft!.disabled, soft!.getAttribute('aria-disabled'), soft!.dataset.disabled]).toEqual([
      false,
      'true',
      'true',
    ]);
    expect(link.dataset.loading).toBe('true');
  });
});

// 类型：IconButton 必须有 aria-label
// @ts-expect-error 缺少 aria-label
export const unnamed = () => <IconButton icon={Settings} />;
