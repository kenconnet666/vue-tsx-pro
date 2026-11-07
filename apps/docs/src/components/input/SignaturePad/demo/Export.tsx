// 导出：handle 拿到 toPng、toSvg；换墨色与笔宽
import { Download } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import {
  Button,
  Flex,
  SignaturePad,
  ToggleGroup,
  ToggleItem,
  type SignaturePadHandle,
} from '@zerodep-dev/vue-tsx-pro-ui';

const pens = {
  ink: { label: '墨黑', color: '#1c2024', min: 0.75, max: 2.75 },
  blue: { label: '签字笔蓝', color: '#1d4ed8', min: 0.6, max: 2.2 },
  marker: { label: '马克笔', color: '#b91c1c', min: 2.5, max: 5 },
};

function download(href: string, name: string) {
  Object.assign(document.createElement('a'), { href, download: name }).click();
}

export default _component(() => {
  let pen = _state<keyof typeof pens>('ink');
  let signature = _state<string | null>(null);
  let pad: SignaturePadHandle | undefined;
  return () => {
    const current = pens[pen];
    return (
      <Flex direction="column" gap="sm">
        <ToggleGroup _value={pen} required size="sm" aria-label="笔">
          {Object.entries(pens).map(([key, item]) => (
            <ToggleItem key={key} value={key}>
              {item.label}
            </ToggleItem>
          ))}
        </ToggleGroup>
        <SignaturePad
          _value={signature}
          penColor={current.color}
          minWidth={current.min}
          maxWidth={current.max}
          handle={(handle) => (pad = handle)}
          aria-label="签名"
        />
        <Flex gap="xs">
          <Button
            size="sm"
            variant="soft"
            icon={Download}
            disabled={!signature}
            onClick={() => signature && download(signature, 'signature.png')}
          >
            PNG
          </Button>
          <Button
            size="sm"
            variant="soft"
            icon={Download}
            disabled={!signature}
            onClick={() => {
              const svg = pad?.toSvg();
              if (!svg) return;
              const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
              download(url, 'signature.svg');
              URL.revokeObjectURL(url);
            }}
          >
            SVG
          </Button>
        </Flex>
      </Flex>
    );
  };
});
