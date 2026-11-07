// 分享链接：输入内容即时生成；纠错等级越高能扛的污损越多，码也越密；下载成 SVG（带上底色）
import { Download } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  encodeQr,
  Field,
  Flex,
  QRCode,
  Small,
  TextField,
  ToggleGroup,
  ToggleItem,
  type QrErrorCorrection,
} from '@zerodep-dev/vue-tsx-pro-ui';

/** 把页面上的二维码存成 SVG 文件：颜色取渲染出来的，补一块底色 */
function downloadSvg(root: Element | null | undefined, name: string) {
  const svg = root?.querySelector('svg');
  if (!root || !svg) return;
  const style = getComputedStyle(root);
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.querySelector('path')!.setAttribute('fill', style.color);
  const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  background.setAttribute('width', '100%');
  background.setAttribute('height', '100%');
  background.setAttribute('fill', style.backgroundColor);
  copy.prepend(background);
  const url = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' }),
  );
  const link = Object.assign(document.createElement('a'), { href: url, download: `${name}.svg` });
  link.click();
  URL.revokeObjectURL(url);
}

export default _component(() => {
  let value = _state('https://zerodep.dev/invite/8f3a2c');
  let ecc = _state<QrErrorCorrection>('M');
  let code = _state.raw<HTMLElement | null>(null);
  const info = () => {
    const qr = encodeQr(value, { ecc });
    return `版本 ${qr.version}，${qr.size} × ${qr.size} 个模块`;
  };
  return () => (
    <Flex gap="lg" align="center" wrap>
      <div ref={(element: unknown) => (code = element as HTMLElement | null)}>
        <QRCode value={value} ecc={ecc} size="9em" />
      </div>
      <Flex direction="column" gap="sm" style={{ flex: '1 1 16em' }}>
        <Field label="内容">
          <TextField _value={value} />
        </Field>
        <Field label="纠错等级">
          <ToggleGroup _value={ecc} required size="sm">
            <ToggleItem value="L">L 7%</ToggleItem>
            <ToggleItem value="M">M 15%</ToggleItem>
            <ToggleItem value="Q">Q 25%</ToggleItem>
            <ToggleItem value="H">H 30%</ToggleItem>
          </ToggleGroup>
        </Field>
        <Flex align="center" gap="sm" justify="between">
          <Small tone="muted">{info()}</Small>
          <Button
            size="sm"
            variant="soft"
            icon={Download}
            onClick={() => downloadSvg(code?.firstElementChild, 'invite')}
          >
            下载 SVG
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
});
