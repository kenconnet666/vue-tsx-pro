/**
 * 二维码：把文字（链接、口令）画成 SVG 二维码；中间可以放 logo；扫码登录这类场景有加载中、已过期（可刷新）、已扫描的状态。
 *
 *   <QRCode value="https://example.com" />
 *   <QRCode value={url} logo="/logo.svg" size="12em" />
 *   <QRCode value={ticket} status={expired ? 'expired' : 'active'} onRefresh={renew} />
 *
 * 编码器自己写（utils/qr/encode.ts，ISO/IEC 18004）：UTF-8 字节模式，自动选最小的版本与罚分最低的掩码；
 * 有 logo 时纠错默认 H（能恢复约 30%，logo 默认占边长的 22%）。四周留 margin 个模块的静区（默认 2）。
 * 颜色是“纸面”（utils/style/paper.ts）：浅色主题下是主题的 surface 底、text 色模块，深色主题下仍是白底深色模块；color、bgColor 可以改。
 * 读屏：svg 是 role="img"，名称默认“二维码”（写 aria-label 改）；状态层是 role="status"，换状态时播报。
 * 部件：Root（div）、Code（svg）、Logo（中间的 logo 底板）、Overlay（状态层）。
 */
import { Check, RotateCw } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import type { VNodeChild } from 'vue';
import { Button, type ButtonProps } from '../base/Button';
import { Icon } from '../base/Icon';
import { Spinner } from '../base/Spinner';
import { Text } from '../base/Text';
import { useLang } from '../config/context';
import { mergeAttrs, mergePartProps, type PartProps } from '../utils/props';
import { encodeQr, type QrErrorCorrection } from '../utils/qr/encode';
import { paperBackground, paperInk, paperStyles } from '../utils/style/paper';
import { partAttrs } from '../config/styles';

/** 二维码的状态 */
export type QRCodeStatus = 'active' | 'loading' | 'expired' | 'scanned';

/** 未声明的属性落到根元素（div）上；aria-label 是二维码图片的名称 */
export interface QRCodeProps extends PartProps<'div', 'role'> {
  /** 要编码的文字（链接、口令），按 UTF-8 */
  value: string;
  /** 纠错等级：L、M、Q、H 依次能恢复约 7%、15%、25%、30% 的损坏；默认 M，有 logo 时 H */
  ecc?: QrErrorCorrection;
  /** 边长：数字是 px，也可以写 CSS 长度；默认 10em */
  size?: number | string;
  /** 四周静区的宽度（模块数），默认 2 */
  margin?: number;
  /** 模块的颜色；默认浅色主题下是文字色，深色主题下是近黑 */
  color?: string;
  /** 底色；默认浅色主题下是 surface，深色主题下是白色 */
  bgColor?: string;
  /** 中间的 logo：图片地址，或任意内容（Avatar、Icon） */
  logo?: VNodeChild;
  /** logo 占边长的比例，默认 0.22；太大会扫不出来 */
  logoSize?: number;
  /** 状态：loading 加载中、expired 已过期（有 onRefresh 时可刷新）、scanned 已扫描；默认 active */
  status?: QRCodeStatus;
  /** 已过期时点“刷新” */
  onRefresh?: () => void;
  /** svg 的部件属性 */
  propsCode?: PartProps<'svg', 'role' | 'viewBox'>;
  /** logo 底板的部件属性 */
  propsLogo?: PartProps<'div'>;
  /** 状态层的部件属性 */
  propsOverlay?: PartProps<'div', 'role'>;
  /** 刷新按钮的部件属性 */
  propsRefresh?: Partial<ButtonProps>;
}

/** 部件的标记（data-scope="q-r-code"） */
const qRCodePart = (part: string) => partAttrs({ name: 'QRCode' }, part);

/** QRCode 的样式：root、code、logo、logoImage、overlay、overlayShown */
export const qrCodeStyles = css.create({
  root: {
    position: 'relative',
    display: 'inline-block',
    flexShrink: 0,
    aspectRatio: '1',
    borderRadius: '_md',
    verticalAlign: 'middle',
  },
  code: { display: 'block', width: '_full', height: '_full', shapeRendering: 'crispEdges' },
  logo: {
    position: 'absolute',
    insetBlockStart: '50%',
    insetInlineStart: '50%',
    translate: '-50% -50%',
    display: 'grid',
    placeItems: 'center',
    aspectRatio: '1',
    padding: '3%',
    // 跟着根元素的底色（bgColor 改了也一样）
    backgroundColor: 'inherit',
    borderRadius: '_sm',
    overflow: 'hidden',
  },
  logoImage: { width: '_full', height: '_full', objectFit: 'contain' },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '_xs',
    padding: '_sm',
    textAlign: 'center',
    borderRadius: 'inherit',
    pointerEvents: 'none',
  },
  overlayShown: {
    pointerEvents: 'auto',
    backgroundColor: `color-mix(in srgb, ${paperBackground} 90%, transparent)`,
    backdropFilter: 'blur(2px)',
  },
});

/** QRCode 的样式：size、colors（任意值，单独一个 create，见 COMPONENTS.md §4） */
const qrCodeSizeStyles = css.create({
  size: (width: string) => ({ width }),
  colors: (color: string, background: string) => ({ color, backgroundColor: background }),
  logo: (percent: string) => ({ width: percent }),
});

/** 一行里连续的深色模块合成一个矩形，整个码是一条 path */
function modulesPath(
  read: { size: number; isDark: (x: number, y: number) => boolean },
  margin: number,
) {
  let path = '';
  for (let y = 0; y < read.size; y++) {
    for (let x = 0; x < read.size; x++) {
      if (!read.isDark(x, y)) continue;
      let run = 1;
      while (read.isDark(x + run, y)) run++;
      path += `M${x + margin} ${y + margin}h${run}v1h-${run}z`;
      x += run;
    }
  }
  return path;
}

/** 二维码（SVG） */
export const QRCode = _component(
  ({
    value,
    ecc,
    size = '10em',
    margin = 2,
    color,
    bgColor,
    logo,
    logoSize = 0.22,
    status = 'active',
    onRefresh,
    propsCode,
    propsLogo,
    propsOverlay,
    propsRefresh,
    'aria-label': label,
    ...rest
  }: QRCodeProps) => {
    const lang = useLang();
    const matrix = _derived.by(() => encodeQr(value, { ecc: ecc ?? (logo ? 'H' : 'M') }));
    const path = _derived.by(() => modulesPath(matrix, margin));

    const overlay = (): VNodeChild => {
      if (status === 'loading') return <Spinner size="lg" />;
      if (status === 'scanned') {
        return (
          <>
            <Icon icon={Check} size="lg" />
            <Text size="sm">{lang.qrScanned}</Text>
          </>
        );
      }
      if (status !== 'expired') return null;
      return (
        <>
          <Text size="sm">{lang.qrExpired}</Text>
          {onRefresh && (
            <Button
              {...mergePartProps<ButtonProps>(
                { size: 'sm', variant: 'soft', icon: RotateCw },
                propsRefresh,
                { onClick: onRefresh },
              )}
            >
              {lang.qrRefresh}
            </Button>
          )}
        </>
      );
    };

    return () => {
      const extent = matrix.size + margin * 2;
      const shown = overlay();
      return (
        <div
          {...mergeAttrs<'div'>(
            {
              sx: [
                paperStyles.paper,
                qrCodeStyles.root,
                qrCodeSizeStyles.size(typeof size === 'number' ? `${size}px` : size),
                (color != null || bgColor != null) &&
                  qrCodeSizeStyles.colors(color ?? paperInk, bgColor ?? paperBackground),
              ],
              ...qRCodePart('root'),
            },
            rest,
          )}
        >
          <svg
            {...mergeAttrs<'svg'>({ sx: qrCodeStyles.code, ...qRCodePart('code') }, propsCode, {
              role: 'img',
              'aria-label': label ?? lang.qrCode,
              viewBox: `0 0 ${extent} ${extent}`,
            })}
          >
            <path d={path} fill="currentColor" />
          </svg>
          {logo != null && logo !== false && (
            <div
              {...mergeAttrs<'div'>(
                {
                  sx: [qrCodeStyles.logo, qrCodeSizeStyles.logo(`${logoSize * 100}%`)],
                  'aria-hidden': true,
                  ...qRCodePart('logo'),
                },
                propsLogo,
              )}
            >
              {typeof logo === 'string' ? (
                <img src={logo} alt="" {...css.attrs(qrCodeStyles.logoImage)} />
              ) : (
                logo
              )}
            </div>
          )}
          <div
            {...mergeAttrs<'div'>(
              {
                sx: [qrCodeStyles.overlay, shown != null && qrCodeStyles.overlayShown],
                ...qRCodePart('overlay'),
              },
              propsOverlay,
              { role: 'status' },
            )}
          >
            {shown}
          </div>
        </div>
      );
    };
  },
);
