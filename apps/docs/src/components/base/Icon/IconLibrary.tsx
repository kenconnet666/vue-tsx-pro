/** Icon 文档页的“图标库”：搜索、点选图标，看大图；复制导入代码、复制或下载 SVG */
import { Check, Copy, Download, FileCode } from '@lucide/icons';
import { _component } from '@zerodep-dev/vue-tsx-pro-tsx';
import { css } from '@zerodep-dev/vue-tsx-pro-tsx/styles';
import { breakpoints } from '@zerodep-dev/vue-tsx-pro-ui/tokens';
import {
  Button,
  Card,
  CodeBlock,
  downloadFile,
  Flex,
  Icon,
  Small,
  Strong,
  ToggleGroup,
  ToggleItem,
  useClipboard,
} from '@zerodep-dev/vue-tsx-pro-ui';
import { allIcons, IconGallery, iconSvg } from '../../../site/IconGallery';

const STROKES = ['1', '1.5', '2', '2.5'] as const;

const styles = css.create({
  layout: {
    display: 'grid',
    gap: '_lg',
    alignItems: 'start',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [breakpoints.lg]: 'minmax(0, 1fr) 22rem',
    },
  },
  // 详情跟着页面滚动停在顶栏下：网格很长时也能看到选中的图标
  detail: { position: 'sticky', top: 'calc(3rem + 1rem)' },
  // 选中的图标放大，和左边网格的小图对照
  preview: {
    display: 'grid',
    placeItems: 'center',
    blockSize: '9rem',
    borderRadius: '_md',
    backgroundColor: '_fill',
    color: '_text',
  },
});

export const IconLibrary = _component(() => {
  let selected = _state('Rocket');
  let stroke = _state<(typeof STROKES)[number]>('2');
  const svgCopy = useClipboard();
  const importCopy = useClipboard();

  return () => {
    const item = allIcons.find((entry) => entry.name === selected);
    if (!item) return null;
    const svg = iconSvg(item.icon, Number(stroke));
    const usage = `import { ${item.name} } from '@lucide/icons';\n\n<Icon icon={${item.name}} />`;
    return (
      <div {...css.attrs(styles.layout)}>
        <IconGallery _value={selected} />
        <Card sx={styles.detail}>
          <Flex direction="column" gap="md">
            <div {...css.attrs(styles.preview)}>
              <Icon
                icon={item.icon}
                size={64}
                strokeWidth={Number(stroke)}
                aria-label={item.name}
              />
            </div>
            <Flex direction="column" gap="xs">
              <Strong>{item.name}</Strong>
              <Small tone="muted">{item.slug}</Small>
            </Flex>
            <Flex align="center" justify="between" gap="sm">
              <Small tone="muted">线宽</Small>
              <ToggleGroup _value={stroke} size="sm" required aria-label="线宽">
                {STROKES.map((width) => (
                  <ToggleItem key={width} value={width}>
                    {width}
                  </ToggleItem>
                ))}
              </ToggleGroup>
            </Flex>
            <Flex gap="sm" wrap>
              <Button
                variant="soft"
                size="sm"
                icon={svgCopy.copied ? Check : FileCode}
                onClick={() => void svgCopy.copy(svg)}
              >
                {svgCopy.copied ? '已复制 SVG' : '复制 SVG'}
              </Button>
              <Button
                variant="surface"
                tone="neutral"
                size="sm"
                icon={Download}
                onClick={() => downloadFile(`${item.slug}.svg`, svg, 'image/svg+xml')}
              >
                下载 SVG
              </Button>
              <Button
                variant="ghost"
                tone="neutral"
                size="sm"
                icon={importCopy.copied ? Check : Copy}
                onClick={() =>
                  void importCopy.copy(`import { ${item.name} } from '@lucide/icons';`)
                }
              >
                {importCopy.copied ? '已复制' : '复制导入'}
              </Button>
            </Flex>
            <CodeBlock lang="tsx" code={usage} />
          </Flex>
        </Card>
      </div>
    );
  };
});
