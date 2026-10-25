import { FileCode, FileJson, FileText, Folder, FolderOpen } from '@lucide/icons';
import { _component } from '@vue-tsx-pro/tsx';
import * as css from '@vue-tsx-pro/tsx/styles';
import { Card, Flex, Small, Tree, type IconData } from '@vue-tsx-pro/ui';

interface Entry {
  path: string;
  name: string;
  children?: Entry[];
}

const file = (dir: string, name: string): Entry => ({ path: `${dir}/${name}`, name });
const folder = (dir: string, name: string, children: (path: string) => Entry[]): Entry => {
  const path = `${dir}/${name}`;
  return { path, name, children: children(path) };
};

const files: Entry[] = [
  folder('', 'src', (src) => [
    folder(src, 'components', (dir) => [
      file(dir, 'Button.tsx'),
      file(dir, 'Card.tsx'),
      file(dir, 'Dialog.tsx'),
    ]),
    folder(src, 'pages', (dir) => [file(dir, 'Home.tsx'), file(dir, 'Orders.tsx')]),
    file(src, 'main.ts'),
    file(src, 'router.ts'),
  ]),
  folder('', 'public', (dir) => [file(dir, 'favicon.svg')]),
  file('', 'package.json'),
  file('', 'README.md'),
];

const iconOf = (entry: Entry, expanded: boolean): IconData => {
  if (entry.children) return expanded ? FolderOpen : Folder;
  if (entry.name.endsWith('.json')) return FileJson;
  if (entry.name.endsWith('.md')) return FileText;
  return FileCode;
};

const styles = css.create({ tree: { height: '17rem' } });

export default _component(() => {
  let expanded = _state(['/src', '/src/components']);
  let selected = _state(['/src/components/Button.tsx']);
  return () => (
    <Card padding="sm">
      <Flex direction="column" gap="sm">
        <Tree
          items={files}
          getKey={(entry) => entry.path}
          getLabel={(entry) => entry.name}
          getChildren={(entry) => entry.children}
          getIcon={iconOf}
          _expanded={_bind(expanded)}
          selectionMode="single"
          _selected={_bind(selected)}
          aria-label="项目文件"
          sx={styles.tree}
        />
        <Small tone="muted">选中：{selected[0] ?? '无'}</Small>
      </Flex>
    </Card>
  );
});
