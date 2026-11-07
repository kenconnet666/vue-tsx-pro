// QRCode：svg 是带名称的图片、viewBox 含静区；有 logo 时用 H 纠错；过期时状态层显示提示与刷新
import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { encodeQr } from '../../utils/qr/encode';
import { mount } from '../../utils/.test/mount';
import { QRCode } from '../QRCode';

describe('QRCode', () => {
  it('svg 是 role="img"，名称默认“二维码”；viewBox 是边长加两边的静区', () => {
    const root = mount(() => <QRCode value="https://example.com" margin={4} />);
    const svg = root.querySelector('svg')!;
    const side = encodeQr('https://example.com').size + 8;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('二维码');
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${side} ${side}`);
    expect(svg.querySelector('path')!.getAttribute('d')).toMatch(/^M\d+ \d+h\d+v1h-\d+z/);
  });

  it('有 logo 时纠错用 H（同样的内容版本更大）；logo 对读屏隐藏', () => {
    const value = 'https://example.com/invite/8f3a';
    const root = mount(() => (
      <>
        <QRCode value={value} aria-label="邀请码" />
        <QRCode value={value} logo="/logo.svg" aria-label="带 logo" />
      </>
    ));
    const [plain, branded] = [...root.querySelectorAll('svg')];
    const sideOf = (svg: SVGElement) => Number(svg.getAttribute('viewBox')!.split(' ')[2]);
    expect(sideOf(branded!)).toBe(encodeQr(value, { ecc: 'H' }).size + 4);
    expect(sideOf(branded!)).toBeGreaterThan(sideOf(plain!));
    expect(root.querySelector('img')!.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('已过期：状态层显示提示，点刷新调用 onRefresh', async () => {
    const onRefresh = vi.fn();
    let status = _state<'active' | 'expired'>('active');
    const root = mount(() => <QRCode value="ticket" status={status} onRefresh={onRefresh} />);
    const overlay = root.querySelector('[role="status"]')!;
    expect(overlay.textContent).toBe('');
    status = 'expired';
    await nextTick();
    expect(overlay.textContent).toContain('二维码已过期');
    overlay.querySelector('button')!.click();
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
