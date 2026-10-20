/** Icon 文档页的“图标库”：搜索、点选图标，看大图与导入代码 */
import { _component } from '@vue-tsx-pro/tsx';
import * as stylex from '@vue-tsx-pro/tsx/stylex';
import { Card, CodeBlock, Flex, Icon, Strong } from '@vue-tsx-pro/ui';
import { IconGallery, iconByName } from '../../../site/IconGallery';

const styles = stylex.create({
  layout: {
    display: 'grid',
    gap: '_lg',
    alignItems: 'start',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 64rem)': 'minmax(0, 1fr) 22rem',
    },
  },
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
  return () => {
    const icon = iconByName(selected);
    return (
      <div {...stylex.attrs(styles.layout)}>
        <IconGallery value={_bind(selected)} />
        <Card>
          <Flex direction="column" gap="md">
            <div {...stylex.attrs(styles.preview)}>
              {icon && <Icon icon={icon} size={64} strokeWidth={1.5} aria-label={selected} />}
            </div>
            <Strong>{selected}</Strong>
            <CodeBlock
              lang="tsx"
              code={`import { ${selected} } from '@lucide/icons';\n\n<Icon icon={${selected}} />`}
            />
          </Flex>
        </Card>
      </div>
    );
  };
});
